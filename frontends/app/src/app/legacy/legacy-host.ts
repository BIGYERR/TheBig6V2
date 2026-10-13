import { afterNextRender, ChangeDetectionStrategy, ChangeDetectorRef, Component, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { Platform } from '../core/platform';
import { LegacyBridge } from './legacy-bridge';
import { LEGACY_REST_OVERLAY, LEGACY_SCRIPT_URL } from '../../legacy/generated/legacy-markup';
import { BugReport } from '../screens/bug-report/bug-report';
import { RestTimer } from '../screens/rest-timer/rest-timer';
import { PopUp } from '../screens/pop-up/pop-up';
import { RandomWorkout } from '../screens/random-workout/random-workout';
import { SwapSheet } from '../screens/swap-sheet/swap-sheet';
import { AddSheet } from '../screens/add-sheet/add-sheet';
import { ChangeSheet } from '../screens/change-sheet/change-sheet';
import { DayDetail } from '../screens/day-detail/day-detail';
import { GeneratingScreen } from '../screens/frames/generating-screen';
import { HomeScreen } from '../screens/frames/home-screen';
import { ProgressFrame } from '../screens/frames/progress-frame';
import { TabBar } from '../screens/frames/tab-bar';
import { GoalSheet } from '../screens/goal-sheet/goal-sheet';
import { MileLock } from '../screens/mile-sheet/mile-lock';
import { MileSheet } from '../screens/mile-sheet/mile-sheet';
import { RpeInfo } from '../screens/rpe-info/rpe-info';
import { SwapNudge } from '../screens/swap-nudge/swap-nudge';
import { Toast } from '../screens/toast/toast';
import { UpdateBanner } from '../screens/update-banner/update-banner';
import { WeekView } from '../screens/week-view/week-view';
import { Wizard } from '../screens/wizard/wizard';

/**
 * The Iron Asylum app: the page's skeleton (its screens, sheets, toast, rest timer, tab bar and pop-up, in the page's
 * order, with the page's classes, ids and taps) and each one's component, over the legacy script built from the page
 * (src/legacy/src, by scripts/build-index.mjs). Since phase E step 33 the skeleton is this template, not the page's markup
 * written in; only the rest sheet's markup is still the page's (it moves with its own build, v0.240.0), written into its
 * element before the script runs so its inline handlers stay. Order matters: the skeleton is drawn, the script runs as a
 * classic script (so its top-level functions stay globals for those handlers and for LegacyBridge) without its boot line,
 * the components are drawn at once (each takes over the legacy functions it replaces, through LegacyBridge.provide), and
 * only then does the legacy init() run, so the boot draws once, onto the components, as the single-file page draws onto
 * its own markup. The legacy navigation (showScreen, the tab bar) still shows and hides the screens by their classes.
 */
@Component({
  selector: 'ia-legacy-host',
  host: { style: 'display: contents' },
  imports: [
    BugReport, RestTimer, PopUp, RandomWorkout, SwapSheet, AddSheet, ChangeSheet, DayDetail, GeneratingScreen, HomeScreen,
    ProgressFrame, TabBar, GoalSheet, MileLock, MileSheet, RpeInfo, SwapNudge, Toast, UpdateBanner, WeekView, Wizard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the page's update banner, kept as it was -->
  <div class="ia-update-banner" id="iaUpdateBanner" (click)="call('iaDoUpdate')">@if (booted()) {<ia-update-banner />}</div>
  <div class="screen active" id="screenHome">@if (booted()) {<ia-home-screen />}</div>
  <div class="screen" id="screenWizard">@if (booted()) {<ia-wizard />}</div>
  <div class="screen" id="screenGenerate">@if (booted()) {<ia-generating-screen />}</div>
  <div class="screen" id="screenWeek">@if (booted()) {<ia-week-view />}</div>
  <div class="overlay" id="detailOverlay">@if (booted()) {<ia-day-detail />}</div>
  <div class="overlay" id="swapOverlay">@if (booted()) {<ia-swap-sheet />}</div>
  <div class="overlay" id="addOverlay">@if (booted()) {<ia-add-sheet />}</div>
  <div class="pop-overlay" id="swapNudgeOverlay">@if (booted()) {<ia-swap-nudge />}</div>
  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the page's RPE card backdrop, kept as it was -->
  <div class="rpe-overlay" id="rpeInfoOverlay" (click)="call('hideRpeInfo', $event)">@if (booted()) {<ia-rpe-info />}</div>
  <div class="rand-overlay" id="randOverlay">@if (booted()) {<ia-random-workout />}</div>
  <div class="rand-overlay" id="restOverlay" #rest></div>
  <div class="rand-overlay" id="changeOverlay">@if (booted()) {<ia-change-sheet />}</div>
  <div class="rand-overlay" id="goalOverlay">@if (booted()) {<ia-goal-sheet />}</div>
  <div class="rand-overlay" id="mileOverlay">@if (booted()) {<ia-mile-sheet />}</div>
  <div class="rand-overlay" id="mileLockOverlay">@if (booted()) {<ia-mile-lock />}</div>
  <div class="toast" id="toast">@if (booted()) {<ia-toast />}</div>
  <div id="restFloat">@if (booted()) {<ia-rest-timer />}</div>
  <div class="screen" id="screenProgress">@if (booted()) {<ia-progress-frame />}</div>
  <div class="screen" id="screenBugs">@if (booted()) {<ia-bug-report />}</div>
  <nav class="tabbar" id="tabBar">@if (booted()) {<ia-tab-bar />}</nav>
  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the page's pop-up backdrop, kept as it was -->
  <div class="pop-overlay" id="popOverlay" (click)="call('popDismissBg', $event)">@if (booted()) {<ia-pop-up />}</div>
  <div class="pop-confetti" id="popConfetti"></div>
  `,
})
export class LegacyHost {
  private readonly platform = inject(Platform);
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly rest = viewChild.required<ElementRef<HTMLElement>>('rest');
  /** Whether the legacy script has run, so the components can take over its functions. */
  protected readonly booted = signal(false);

  constructor() {
    afterNextRender(() => void this.mount());
  }

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }

  private async mount(): Promise<void> {
    await this.platform.whenReady();
    // Written through the element, not an [innerHTML] binding, so Angular's sanitizer keeps its inline handlers.
    this.rest().nativeElement.innerHTML = LEGACY_REST_OVERLAY;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = LEGACY_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`failed to load ${LEGACY_SCRIPT_URL}`));
      document.body.appendChild(script);
    });
    this.bridge.markBooted();
    this.booted.set(true);
    this.cdr.detectChanges();
    this.bridge.call('init');
  }
}
