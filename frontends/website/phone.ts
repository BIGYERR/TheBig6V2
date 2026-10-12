import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon, IconName } from '../common/icon';
import { RestClock } from './rest-clock';

interface StripDay {
  d: string;
  date: number;
  cardio: string;
  focus: string;
  today?: boolean;
}

interface Row {
  icon: IconName;
  name: string;
  rx: string;
  done?: boolean;
}

// A drawing of the app's This Week screen: the WEEK hero, the day strip with today in signal, today's session
// with the rest stopwatch running, the stat tiles and the tab bar. The island above it carries the same clock,
// as the native app's Live Activity does. Every label here is decoration, so the whole phone is aria-hidden and
// the page says it in words beside it.
@Component({
  selector: 'ia-phone',
  imports: [Icon, RestClock],
  templateUrl: './phone.html',
  host: { class: 'phone', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Phone {
  protected readonly strip: StripDay[] = [
    { d: 'M', date: 12, cardio: 'INT', focus: 'LEG' },
    { d: 'T', date: 13, cardio: 'EZ', focus: 'PSH' },
    { d: 'W', date: 14, cardio: '', focus: '' },
    { d: 'T', date: 15, cardio: 'LI', focus: 'HNG', today: true },
    { d: 'F', date: 16, cardio: '', focus: 'PUL' },
    { d: 'S', date: 17, cardio: 'LSD', focus: 'MOB' },
    { d: 'S', date: 18, cardio: '', focus: '' },
  ];

  // The prescription separator (4×5 — RPE 8) is the app's own structural format, exempt from the copy rule.
  protected readonly rows: Row[] = [
    { icon: 'footprints', name: 'Long interval', rx: '2 × 10 min — RPE 8', done: true },
    { icon: 'dumbbell', name: 'Trap bar deadlift', rx: '4×5 — RPE 8', done: true },
    { icon: 'dumbbell', name: 'Bulgarian split squat', rx: '3×8 — RPE 8' },
    { icon: 'dumbbell', name: 'Suitcase carry', rx: '3×40 yd — left, then right' },
  ];
}
