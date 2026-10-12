// ── Calendar: the day orders, local dates and week Mondays the engine and the screens share. ──
import type { DayKey } from '../domain/index.ts';
const ALL_DAYS_ORDER: DayKey[]=['sun','mon','tue','wed','thu','fri','sat'];
const _ISO_ORDER: DayKey[] = ['mon','tue','wed','thu','fri','sat','sun'];
function _isoOf(d: Date): string{ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function getWeekMonday(dateStr: string): Date{
  // Get the Monday of the week containing the given date string
  const parts=dateStr.split('-');
  const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
  d.setHours(0,0,0,0);
  // getDay(): 0=Sun,1=Mon,...,6=Sat
  // Days since Monday: Sun=6, Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5
  const dayOfWeek=d.getDay();
  const daysSinceMonday=dayOfWeek===0?6:dayOfWeek-1;
  d.setDate(d.getDate()-daysSinceMonday);
  return d;
}
function _parseLocalDate(s: string | null | undefined): Date | null{
  const p=String(s||'').split('-');
  if(p.length!==3) return null;
  const d=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
  if(isNaN(d.getTime())) return null;
  d.setHours(0,0,0,0); return d;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { ALL_DAYS_ORDER, _ISO_ORDER, _isoOf, _parseLocalDate, getWeekMonday };
