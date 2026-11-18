/**
 * A recorded run as GPX 1.1 (D267 P-GPSTEST), the file the Run recorder shares. One track, one segment per stretch
 * between Start, the pauses and Finish, one point per valid fix with its time. Altitude goes in only where iOS gave it
 * an accuracy. Each point also carries iOS's horizontal accuracy and, where valid, its speed, as extensions other GPX
 * readers ignore, so the comparison on the Mac sees what the phone saw. From D296 each point also carries the step
 * total and the barometer's altitude last read at or before its time (ia:steps, ia:ralt), where the run has them; the
 * ele stays iOS's GPS altitude.
 */
import { gpsSummary, isGpsBaro, isGpsMark, isGpsSteps, type GpsLine } from './track.ts';

export const GPX_IA_NS = 'https://bigyerr.github.io/TheBig6V2/gpx/1';

function xml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function iso(t: number): string {
  return new Date(t).toISOString();
}

export function recordingGpx(lines: readonly GpsLine[], name: string): string {
  const run = gpsSummary(lines);
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<gpx version="1.1" creator="The Asylum" xmlns="http://www.topografix.com/GPX/1/1" xmlns:ia="${GPX_IA_NS}">`,
    `  <metadata><name>${xml(name)}</name>${run.startT === null ? '' : `<time>${iso(run.startT)}</time>`}</metadata>`,
    `  <trk><name>${xml(name)}</name><type>running</type>`,
  ];
  const started = lines.findIndex((l) => isGpsMark(l) && l.mark === 'start');
  const motion = started < 0 ? [] : lines.slice(started).filter((l) => isGpsSteps(l) || isGpsBaro(l));
  let m = 0;
  let steps: number | null = null;
  let ralt: number | null = null;
  for (const stretch of run.stretches) {
    out.push('    <trkseg>');
    for (const f of stretch) {
      for (; m < motion.length && (motion[m]?.t ?? Infinity) <= f.t; m++) {
        const l = motion[m];
        if (l && isGpsSteps(l)) steps = l.steps;
        else if (l && isGpsBaro(l)) ralt = l.ralt;
      }
      const ele = f.alt !== undefined && f.va !== undefined && f.va >= 0 ? `<ele>${f.alt}</ele>` : '';
      const spd = f.spd !== undefined && f.spd >= 0 ? `<ia:spd>${f.spd}</ia:spd>` : '';
      const st = steps === null ? '' : `<ia:steps>${steps}</ia:steps>`;
      const ra = ralt === null ? '' : `<ia:ralt>${ralt}</ia:ralt>`;
      out.push(
        `      <trkpt lat="${f.lat}" lon="${f.lon}">${ele}<time>${iso(f.t)}</time>` +
          `<extensions><ia:ha>${f.ha}</ia:ha>${spd}${st}${ra}</extensions></trkpt>`,
      );
    }
    out.push('    </trkseg>');
  }
  out.push('  </trk>', '</gpx>', '');
  return out.join('\n');
}
