// Formatting shared by every admin section.

export function ms(value: number | null | undefined): string {
  return value == null ? '–' : `${value} ms`;
}

export function span(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

export function ago(t: number, now: number): string {
  return t ? `${span((now - t) / 1000)} ago` : '–';
}

export function when(t: number): string {
  return t ? new Date(t).toLocaleString() : '';
}

/** The version as the app sent it, with its MAJOR.MINOR.PATCH reading when that differs (239 reads as 0.239.0). */
export function version(raw: string, semver: string): string {
  if (!raw) return 'unknown';
  return semver && semver !== raw ? `${raw} (${semver})` : raw;
}
