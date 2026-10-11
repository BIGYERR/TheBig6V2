import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// The app's icon grammar (THE_ASYLUM_DS_REFERENCE.md): 24×24, 2px stroke, round caps, currentColor. Lucide (MIT)
// shapes, with every circle and rect written as a path so one <path> loop draws any icon.
const ICONS = {
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  check: ['M20 6 9 17l-5-5'],
  zap: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'],
  footprints: [
    'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0z',
    'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0z',
    'M16 17h4',
    'M4 13h4',
  ],
  flag: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  target: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M6 12a6 6 0 1 0 12 0a6 6 0 1 0-12 0', 'M10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
  backpack: [
    'M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
    'M8 10h8',
    'M8 18h8',
    'M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6',
    'M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  ],
  timer: ['M10 2h4', 'M12 14l3-3', 'M4 14a8 8 0 1 0 16 0a8 8 0 1 0-16 0'],
  dice: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 8h.01', 'M16 8h.01', 'M12 12h.01', 'M8 16h.01', 'M16 16h.01'],
  trending: ['M22 7 13.5 15.5 8.5 10.5 2 17', 'M16 7h6v6'],
  dumbbell: [
    'M14.4 14.4 9.6 9.6',
    'M18.66 21.49a2 2 0 1 1-2.83-2.83l-1.77 1.77a2 2 0 1 1-2.83-2.83l6.36-6.36a2 2 0 1 1 2.83 2.83l-1.77 1.77a2 2 0 1 1 2.83 2.83z',
    'm21.5 21.5-1.4-1.4',
    'M3.9 3.9 2.5 2.5',
    'M6.4 12.77a2 2 0 1 1-2.83-2.83l1.77-1.77a2 2 0 1 1-2.83-2.83l2.83-2.83a2 2 0 1 1 2.83 2.83l1.77-1.77a2 2 0 1 1 2.83 2.83z',
  ],
  bike: ['M15 17.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M2 17.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M14 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0', 'M12 17.5V14l-3-3 4-3 2 3h2'],
  waves: [
    'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
  ],
  calendar: ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 10h18'],
  home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  chart: ['M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  bug: ['M12 20v-9', 'M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z', 'M14.12 3.88 16 2', 'M21 21a4 4 0 0 0-3.81-4', 'M21 5a4 4 0 0 1-3.55 3.97', 'M22 13h-4', 'M3 21a4 4 0 0 1 3.81-4', 'M3 5a4 4 0 0 0 3.55 3.97', 'M6 13H2', 'm8 2 1.88 1.88', 'M9 7.13V6a3 3 0 1 1 6 0v1.13'],
  smartphone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  share: ['M12 2v13', 'm16 6-4-4-4 4', 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8'],
  plusSquare: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 12h8', 'M12 8v8'],
  plus: ['M5 12h14', 'M12 5v14'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  flame: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'ia-icon',
  template: `<svg
    viewBox="0 0 24 24"
    [attr.width]="size()"
    [attr.height]="size()"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    @for (d of paths(); track $index) {
      <path [attr.d]="d" />
    }
  </svg>`,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  protected readonly paths = computed(() => ICONS[this.name()]);
}
