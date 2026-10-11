import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Icon, IconName } from './icon';
import { Phone } from './phone';
import { RestClock } from './rest-clock';
import { Reveal } from './reveal';

// The app on GitHub Pages. Every "open the app" button goes here.
const APP_URL = 'https://bigyerr.github.io/TheBig6V2/';

interface Feature {
  icon: IconName;
  title: string;
  body: string;
  span: 'half' | 'third';
}

// Copy rule (CLAUDE.md): what the athlete reads has no mid sentence hyphens or dashes, short declarative sentences,
// a coach's voice, and no third party brand names. Every claim below is something the engine does today.
const FEATURES: Feature[] = [
  {
    icon: 'timer',
    title: 'Rest on the island.',
    body: 'In the native iPhone app, your rest clock rides the Dynamic Island. Lock the phone. Keep counting.',
    span: 'third',
  },
  {
    icon: 'footprints',
    title: 'The long run is the day.',
    body: 'Race plans protect it. Over 75 minutes on your feet gets mobility only. Shorter runs get light upper body work. No carries. No heavy legs the day before.',
    span: 'third',
  },
  {
    icon: 'flag',
    title: 'Race week, handled.',
    body: 'Primers through three days out. No lifting two days out. A shakeout run on the eve. Race day is for racing.',
    span: 'third',
  },
  {
    icon: 'target',
    title: 'Effort, not formulas.',
    body: 'No guessed percentages. Every lift is coached by RPE, so a bad night of sleep never wrecks a session.',
    span: 'third',
  },
  {
    icon: 'shield',
    title: 'Hurt? It works around it.',
    body: 'Log an injury and the days ahead reshape around it. Days you already trained stay exactly as you did them.',
    span: 'half',
  },
  {
    icon: 'backpack',
    title: 'Train anywhere.',
    body: 'On the road? Pick room only, mini gym or full gym for just those dates. Travel days hold your strength. Your running keeps building.',
    span: 'half',
  },
  {
    icon: 'check',
    title: 'Log one number.',
    body: 'The plan sets the fixed number. You log the free one. The app works out the third, like your pace per mile.',
    span: 'third',
  },
  {
    icon: 'dice',
    title: 'Wildcard days.',
    body: 'Need something different? Roll a Wildcard. Finish it and your streak lives.',
    span: 'third',
  },
  {
    icon: 'trending',
    title: 'See the work.',
    body: 'Streaks, milestones and charts for every program you run. Your numbers, kept per program.',
    span: 'third',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Answer the intake.',
    body: 'Goal, lifting focus, training days, age and sports. Add a race date or your current mile time if you have one.',
  },
  {
    n: '02',
    title: 'Get the whole block.',
    body: 'Every week, every session, every set, built at once. It is seeded, so your plan never reshuffles on you.',
  },
  {
    n: '03',
    title: 'Train. Log. Repeat.',
    body: 'Rate the effort. Spin the wheels for time and distance. Mark the day done. The app keeps the score.',
  },
];

const NUMBERS = [
  { n: '4', label: 'Race plans', body: '5K, 10K, half marathon and marathon.' },
  { n: '4', label: 'Test goals', body: 'Pace, mile, 1.5 mile and base fitness.' },
  { n: '3', label: 'Cardio sports', body: 'Run, bike and swim on one calendar.' },
  { n: '18', label: 'Week marathon', body: 'The longest block. Every long run mapped.' },
];

const RACES = [
  { name: '5K', weeks: 8, note: 'Two speed days a week. No race on the calendar? It ends in a time trial.' },
  { name: '10K', weeks: 8, note: 'Speed, recovery and a long run every week. Same time trial finish.' },
  { name: 'Half', weeks: 14, note: 'Long runs build in steps, with cutback weeks already written in.' },
  { name: 'Marathon', weeks: 18, note: 'The full build to 26.2. The taper is already written.' },
];

const DOCTRINE = [
  {
    k: 'Test goals',
    source: 'Naval Special Warfare Physical Training Guide',
    items: ['Pace goal', 'Mile time', '1.5 miles under 10:00', 'Base fitness'],
    foot: 'Four runs a week. 400m repeats start at four and never pass eight.',
  },
  {
    k: 'Race goals',
    source: 'Proven race plans, session for session',
    items: ['5K', '10K', 'Half marathon', 'Marathon'],
    foot: 'Sessions are transcribed as written. Names, structure and long runs.',
  },
  {
    k: 'Strength',
    source: 'Hypertrophy references and RPE coaching',
    items: ['12 to 15 sets per muscle a week on size blocks', 'Positional lifts capped at six reps', 'Joint friendly picks as you age', 'Farmer, suitcase and overhead carries'],
    foot: 'Every rule here was argued for, tested and kept.',
  },
];

// A sample week for a mile time goal on five days. Hard days pair heavy legs or a hinge with speed work.
const WEEK = [
  { d: 'Mon', lift: 'Legs, heavy', run: 'Short intervals 6 × 400m', tag: 'Hard' },
  { d: 'Tue', lift: 'Upper push', run: 'Steady run 30 min', tag: 'Easy' },
  { d: 'Wed', lift: '', run: '', tag: 'Rest' },
  { d: 'Thu', lift: 'Hinge', run: 'Long interval 2 × 10 min', tag: 'Hard' },
  { d: 'Fri', lift: 'Pull and core', run: '', tag: 'Lift' },
  { d: 'Sat', lift: 'Mobility', run: 'Long run 50 min', tag: 'Long' },
  { d: 'Sun', lift: '', run: '', tag: 'Rest' },
];

const FAQ = [
  {
    q: 'Do I need a gym?',
    a: 'A gym helps. A home setup works. On the road, switch to room only, mini gym or full gym for just those days.',
  },
  {
    q: 'Does it tell me what weight to lift?',
    a: 'It tells you how hard. RPE 8 means two reps left in the tank. You pick the load that gets you there.',
  },
  {
    q: 'What if I miss a day?',
    a: 'Mark it skipped and move on. Do not cram it back in. Roll a Wildcard if you want to keep the streak alive.',
  },
  {
    q: 'Will my plan change after I start?',
    a: 'Days you trained are locked. They stay exactly as you did them. Only the days ahead adapt, like when you log an injury or a trip.',
  },
  {
    q: 'Can I train for a race and still get strong?',
    a: 'That is the whole point. Pick a race. The lifting works around the running, not against it.',
  },
  {
    q: 'Is it for beginners?',
    a: 'It assumes you have trained before. There is no couch tier yet.',
  },
  {
    q: 'What phone do I need?',
    a: 'An iPhone. Open it in Safari and add it to your home screen. It is built and tested there.',
  },
];

const TICKER = ['Squat', '400m repeats', 'Deadlift', 'Long run', 'Farmer carry', 'Tempo', 'Pull up', 'Race day', 'Bench', 'Shakeout', 'Hinge', 'Time trial'];

@Component({
  selector: 'ia-site',
  imports: [Icon, Phone, RestClock, Reveal],
  templateUrl: './site.html',
  host: { '(window:scroll)': 'onScroll()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Site {
  protected readonly appUrl = APP_URL;
  protected readonly year = new Date().getFullYear();
  protected readonly features = FEATURES;
  protected readonly steps = STEPS;
  protected readonly numbers = NUMBERS;
  protected readonly races = RACES;
  protected readonly longest = Math.max(...RACES.map((r) => r.weeks));
  protected readonly doctrine = DOCTRINE;
  protected readonly week = WEEK;
  protected readonly faq = FAQ;
  protected readonly ticker = [...TICKER, ...TICKER];

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  protected onScroll(): void {
    const past = window.scrollY > 12;
    if (past !== this.scrolled()) this.scrolled.set(past);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
