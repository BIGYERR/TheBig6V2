/**
 * A FIT file reader (D267 P-GPSTEST), from the FIT protocol (Garmin's FIT SDK, "Flexible and Interoperable Data
 * Transfer Protocol"): the file header, definition and data messages, compressed timestamp headers, developer fields
 * skipped, and the file CRC checked. It keeps each data message's scalar numeric fields and leaves out the ones holding
 * the protocol's invalid value. The comparison reads a watch's run with it, and the app reuses it when it reads watch
 * runs. It reads the first FIT file of a chained file only.
 */

/** FIT time is seconds since 1989-12-31T00:00:00Z: this many ms after 1970. */
export const FIT_EPOCH_MS = 631065600000;

export class FitError extends Error {}

/** One data message: its global message number and its valid scalar numeric fields, by field number. */
export interface FitMessage {
  num: number;
  fields: Map<number, number>;
}

const CRC_TABLE = [
  0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801,
  0x4400,
];

/** The FIT CRC-16 of bytes[start, end). */
export function fitCrc(bytes: Uint8Array, start = 0, end = bytes.length): number {
  let crc = 0;
  for (let i = start; i < end; i++) {
    const b = bytes[i] ?? 0;
    let tmp = CRC_TABLE[crc & 0xf] ?? 0;
    crc = ((crc >> 4) & 0x0fff) ^ tmp ^ (CRC_TABLE[b & 0xf] ?? 0);
    tmp = CRC_TABLE[crc & 0xf] ?? 0;
    crc = ((crc >> 4) & 0x0fff) ^ tmp ^ (CRC_TABLE[(b >> 4) & 0xf] ?? 0);
  }
  return crc;
}

interface FieldDef {
  num: number;
  size: number;
  base: number;
}
interface Definition {
  num: number;
  little: boolean;
  fields: FieldDef[];
  devBytes: number;
}

/** The base types' sizes and invalid values (the integer ones; floats are invalid when NaN or all ones). */
const BASE: Record<number, { size: number; read: 'u' | 's' | 'f'; invalid?: number }> = {
  0x00: { size: 1, read: 'u', invalid: 0xff },
  0x01: { size: 1, read: 's', invalid: 0x7f },
  0x02: { size: 1, read: 'u', invalid: 0xff },
  0x83: { size: 2, read: 's', invalid: 0x7fff },
  0x84: { size: 2, read: 'u', invalid: 0xffff },
  0x85: { size: 4, read: 's', invalid: 0x7fffffff },
  0x86: { size: 4, read: 'u', invalid: 0xffffffff },
  0x88: { size: 4, read: 'f' },
  0x89: { size: 8, read: 'f' },
  0x0a: { size: 1, read: 'u', invalid: 0 },
  0x8b: { size: 2, read: 'u', invalid: 0 },
  0x8c: { size: 4, read: 'u', invalid: 0 },
  0x0d: { size: 1, read: 'u', invalid: 0xff },
};

function readField(view: DataView, at: number, def: FieldDef, little: boolean): number | null {
  const base = BASE[def.base];
  if (!base || base.size !== def.size) return null;
  let v: number;
  if (base.read === 'f') v = def.size === 4 ? view.getFloat32(at, little) : view.getFloat64(at, little);
  else if (def.size === 1) v = base.read === 's' ? view.getInt8(at) : view.getUint8(at);
  else if (def.size === 2) v = base.read === 's' ? view.getInt16(at, little) : view.getUint16(at, little);
  else v = base.read === 's' ? view.getInt32(at, little) : view.getUint32(at, little);
  if (base.read === 'f') return Number.isFinite(v) ? v : null;
  return v === base.invalid ? null : v;
}

/** Every data message of the file, in order. Throws FitError when the file is not FIT or its CRC is wrong. */
export function readFit(bytes: Uint8Array): FitMessage[] {
  if (bytes.length < 14) throw new FitError('too short for a FIT file');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = bytes[0] ?? 0;
  if (headerSize !== 12 && headerSize !== 14) throw new FitError('not a FIT header');
  if (String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0) !== '.FIT') throw new FitError('not a FIT file');
  if (headerSize === 14) {
    const headerCrc = view.getUint16(12, true);
    if (headerCrc !== 0 && headerCrc !== fitCrc(bytes, 0, 12)) throw new FitError('header CRC is wrong');
  }
  const dataEnd = headerSize + view.getUint32(4, true);
  if (dataEnd + 2 > bytes.length) throw new FitError('the file is cut short');
  if (view.getUint16(dataEnd, true) !== fitCrc(bytes, 0, dataEnd)) throw new FitError('file CRC is wrong');

  const defs = new Map<number, Definition>();
  const out: FitMessage[] = [];
  let lastTime: number | null = null;
  let at = headerSize;
  while (at < dataEnd) {
    const head = bytes[at++] ?? 0;
    let local: number;
    let offset: number | null = null;
    if (head & 0x80) {
      local = (head >> 5) & 0x03;
      offset = head & 0x1f;
    } else {
      local = head & 0x0f;
      if (head & 0x40) {
        const little = bytes[at + 1] === 0;
        const num = view.getUint16(at + 2, little);
        const count = bytes[at + 4] ?? 0;
        at += 5;
        const fields: FieldDef[] = [];
        for (let i = 0; i < count; i++, at += 3) fields.push({ num: bytes[at] ?? 0, size: bytes[at + 1] ?? 0, base: bytes[at + 2] ?? 0 });
        let devBytes = 0;
        if (head & 0x20) {
          const devCount = bytes[at++] ?? 0;
          for (let i = 0; i < devCount; i++, at += 3) devBytes += bytes[at + 1] ?? 0;
        }
        defs.set(local, { num, little, fields, devBytes });
        continue;
      }
    }
    const def = defs.get(local);
    if (!def) throw new FitError(`a data message for local type ${local} has no definition`);
    const fields = new Map<number, number>();
    for (const f of def.fields) {
      const v = readField(view, at, f, def.little);
      if (v !== null) fields.set(f.num, v);
      at += f.size;
    }
    at += def.devBytes;
    if (offset !== null && lastTime !== null) {
      // The offset replaces the last time's low five bits, rolling over when it is smaller (arithmetic, not bitwise:
      // a bitwise operator would read the time as a signed 32-bit integer).
      const low = lastTime % 32;
      const t = lastTime - low + offset + (offset >= low ? 0 : 32);
      fields.set(253, t);
    }
    const t = fields.get(253);
    if (t !== undefined) lastTime = t;
    out.push({ num: def.num, fields });
  }
  return out;
}

/** FIT time (seconds since the FIT epoch) as ms since 1970. */
export function fitTimeMs(t: number): number {
  return FIT_EPOCH_MS + t * 1000;
}

const SEMICIRCLE_DEG = 180 / 2 ** 31;

/** A record message with a position: time in ms since 1970, degrees, metres, metres per second. */
export interface FitPoint {
  t: number;
  lat: number;
  lon: number;
  distM?: number;
  spd?: number;
  alt?: number;
}

/** The record messages (global 20) that carry a position and a time, in order. */
export function fitTrack(messages: readonly FitMessage[]): FitPoint[] {
  const out: FitPoint[] = [];
  for (const m of messages) {
    if (m.num !== 20) continue;
    const t = m.fields.get(253);
    const lat = m.fields.get(0);
    const lon = m.fields.get(1);
    if (t === undefined || lat === undefined || lon === undefined) continue;
    const p: FitPoint = { t: fitTimeMs(t), lat: lat * SEMICIRCLE_DEG, lon: lon * SEMICIRCLE_DEG };
    const dist = m.fields.get(5);
    if (dist !== undefined) p.distM = dist / 100;
    const spd = m.fields.get(73) ?? m.fields.get(6);
    if (spd !== undefined) p.spd = spd / 1000;
    const alt = m.fields.get(78) ?? m.fields.get(2);
    if (alt !== undefined) p.alt = alt / 5 - 500;
    out.push(p);
  }
  return out;
}

/** A lap (global 19) or session (global 18): its start, distance and times. */
export interface FitTotals {
  startT?: number;
  distanceM?: number;
  timerS?: number;
  elapsedS?: number;
}

function totals(m: FitMessage): FitTotals {
  const o: FitTotals = {};
  const start = m.fields.get(2);
  if (start !== undefined) o.startT = fitTimeMs(start);
  const dist = m.fields.get(9);
  if (dist !== undefined) o.distanceM = dist / 100;
  const timer = m.fields.get(8);
  if (timer !== undefined) o.timerS = timer / 1000;
  const elapsed = m.fields.get(7);
  if (elapsed !== undefined) o.elapsedS = elapsed / 1000;
  return o;
}

export function fitLaps(messages: readonly FitMessage[]): FitTotals[] {
  return messages.filter((m) => m.num === 19).map(totals);
}

export function fitSessions(messages: readonly FitMessage[]): FitTotals[] {
  return messages.filter((m) => m.num === 18).map(totals);
}
