// Devices the backend has heard from, keyed by the UID the backend issued them.
// In memory, with an optional JSON file behind it (DATA_FILE). A real database replaces this module later;
// app.js only uses the methods below.

import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RTT_SAMPLES = 50; // per device, newest last
const MAX_RTT_MS = 60_000;
const SAVE_DELAY_MS = 2_000;

export function isUid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export class DeviceStore {
  constructor({ connectedWindowMs = 45_000, maxDevices = 5_000, dataFile = '', now = () => Date.now() } = {}) {
    this.connectedWindowMs = connectedWindowMs;
    this.maxDevices = maxDevices;
    this.dataFile = dataFile;
    this.now = now;
    this.devices = new Map();
    this.beatsTotal = 0;
    this.saveTimer = null;
  }

  // One beat from the app. A missing or malformed UID gets a fresh one, which the app keeps from then on.
  // A well-formed UID the store has not seen (issued before a restart wiped memory) is kept: same phone.
  heartbeat(beat = {}, meta = {}) {
    const t = this.now();
    let uid = isUid(beat.uid) ? beat.uid.toLowerCase() : null;
    const issued = !uid;
    if (!uid) uid = randomUUID();

    let d = this.devices.get(uid);
    if (!d) {
      d = blank(uid, t);
      this.devices.set(uid, d);
    }

    if (!this.isConnected(d, t)) {
      d.sessions += 1;
      d.connectedSince = t;
    }
    d.online = true;
    d.lastSeen = t;
    d.beats += 1;
    this.beatsTotal += 1;

    d.label = text(beat.label, 80) || d.label;
    d.deviceName = text(beat.deviceName, 60) || d.deviceName;
    d.platform = text(beat.platform, 20) || d.platform;
    d.appVersion = text(beat.appVersion, 20) || d.appVersion;
    d.screen = text(beat.screen, 30) || d.screen;
    d.ua = text(meta.ua, 300) || d.ua;

    const rtt = Number(beat.rttMs);
    if (beat.rttMs != null && Number.isFinite(rtt) && rtt >= 0 && rtt <= MAX_RTT_MS) {
      d.rtt.push(Math.round(rtt));
      if (d.rtt.length > RTT_SAMPLES) d.rtt.shift();
    }

    this.evict();
    this.scheduleSave();
    return { uid, issued, device: d };
  }

  // The app went to the background or closed. It stops counting as connected now, not a window later.
  bye(uid) {
    const d = isUid(uid) ? this.devices.get(uid.toLowerCase()) : null;
    if (!d) return false;
    d.online = false;
    this.scheduleSave();
    return true;
  }

  rename(uid, name) {
    const d = isUid(uid) ? this.devices.get(uid.toLowerCase()) : null;
    if (!d) return null;
    d.name = text(name, 60);
    this.scheduleSave();
    return d;
  }

  isConnected(d, t = this.now()) {
    return d.online && t - d.lastSeen <= this.connectedWindowMs;
  }

  stats() {
    const t = this.now();
    const live = [...this.devices.values()].filter((d) => this.isConnected(d, t));
    // Latency across connected devices: each one's last 10 samples, so one chatty device cannot drown the rest.
    const samples = live.flatMap((d) => d.rtt.slice(-10));
    return {
      now: t,
      connectedWindowMs: this.connectedWindowMs,
      connected: live.length,
      uniques: this.devices.size,
      beatsTotal: this.beatsTotal,
      latency: summarize(samples),
    };
  }

  // q matches any text field; name matches the admin name or the name the device reported.
  list({ q = '', name = '', connected = false, page = 1, pageSize = 25 } = {}) {
    const t = this.now();
    const needle = q.trim().toLowerCase();
    const nameNeedle = name.trim().toLowerCase();
    let rows = [...this.devices.values()];
    if (connected) rows = rows.filter((d) => this.isConnected(d, t));
    if (needle) {
      rows = rows.filter((d) =>
        [d.uid, d.name, d.deviceName, d.label, d.platform, d.appVersion, d.screen, d.ua].some((v) =>
          v.toLowerCase().includes(needle),
        ),
      );
    }
    if (nameNeedle) {
      rows = rows.filter((d) => `${d.name}\n${d.deviceName}`.toLowerCase().includes(nameNeedle));
    }
    // Connected first, then most recently seen.
    rows.sort((a, b) => Number(this.isConnected(b, t)) - Number(this.isConnected(a, t)) || b.lastSeen - a.lastSeen);

    const size = clamp(pageSize, 1, 100, 25);
    const pages = Math.max(1, Math.ceil(rows.length / size));
    const current = clamp(page, 1, pages, 1);
    const items = rows.slice((current - 1) * size, current * size).map((d) => this.view(d, t));
    return { items, total: rows.length, page: current, pageSize: size, pages };
  }

  view(d, t = this.now()) {
    const { rtt, online, ...rest } = d;
    const connected = this.isConnected(d, t);
    return {
      ...rest,
      connected,
      connectedSince: connected ? d.connectedSince : 0,
      latency: { last: rtt.length ? rtt[rtt.length - 1] : null, ...summarize(rtt) },
    };
  }

  // Least recently seen goes first when the store is full.
  evict() {
    if (this.devices.size <= this.maxDevices) return;
    const oldest = [...this.devices.values()].sort((a, b) => a.lastSeen - b.lastSeen);
    for (const d of oldest.slice(0, this.devices.size - this.maxDevices)) this.devices.delete(d.uid);
  }

  load() {
    if (!this.dataFile) return 0;
    let saved;
    try {
      saved = JSON.parse(readFileSync(this.dataFile, 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`store: could not read ${this.dataFile}: ${err.message}`);
      return 0;
    }
    this.beatsTotal = Number(saved?.beatsTotal) || 0;
    // Rebuild each record on the blank shape and take only fields of the right type, so a hand-edited or
    // older file cannot crash startup or break search. Nobody is connected across a restart.
    for (const r of Array.isArray(saved?.devices) ? saved.devices : []) {
      if (!isUid(r?.uid)) continue;
      const d = blank('', 0);
      for (const key of Object.keys(d)) {
        if (typeof d[key] === 'string' && typeof r[key] === 'string') d[key] = r[key];
        if (typeof d[key] === 'number' && Number.isFinite(r[key])) d[key] = r[key];
      }
      d.uid = r.uid.toLowerCase();
      d.online = false;
      d.rtt = Array.isArray(r.rtt) ? r.rtt.filter(Number.isFinite).slice(-RTT_SAMPLES) : [];
      this.devices.set(d.uid, d);
    }
    return this.devices.size;
  }

  scheduleSave() {
    if (!this.dataFile || this.saveTimer) return;
    this.saveTimer = setTimeout(() => this.flush(), SAVE_DELAY_MS);
    this.saveTimer.unref();
  }

  // Write to a temp file, then rename over the old one, so a crash mid-write never leaves half a file.
  flush() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.dataFile) return;
    const body = JSON.stringify({ savedAt: this.now(), beatsTotal: this.beatsTotal, devices: [...this.devices.values()] });
    try {
      mkdirSync(dirname(this.dataFile), { recursive: true });
      writeFileSync(`${this.dataFile}.tmp`, body);
      renameSync(`${this.dataFile}.tmp`, this.dataFile);
    } catch (err) {
      console.warn(`store: could not write ${this.dataFile}: ${err.message}`);
    }
  }
}

export function summarize(samples) {
  if (!samples.length) return { samples: 0, avg: null, p50: null, p95: null, min: null, max: null };
  const sorted = [...samples].sort((a, b) => a - b);
  // Nearest rank: the smallest sample with at least p of the samples at or below it.
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
  return {
    samples: sorted.length,
    avg: Math.round(sorted.reduce((sum, v) => sum + v, 0) / sorted.length),
    p50: pct(0.5),
    p95: pct(0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function blank(uid, t) {
  return {
    uid,
    name: '', // given in the admin
    deviceName: '', // reported by the device, if it ever sends one
    label: '',
    platform: '',
    appVersion: '',
    screen: '',
    ua: '',
    firstSeen: t,
    lastSeen: 0,
    online: false,
    connectedSince: 0,
    sessions: 0,
    beats: 0,
    rtt: [],
  };
}

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// A missing or non-numeric value takes the fallback.
function clamp(value, lo, hi, fallback) {
  const n = Number.parseInt(value, 10);
  return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : fallback));
}
