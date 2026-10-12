import type { Type } from '@angular/core';
import { BugReport } from './bug-report/bug-report';
import { RestTimer } from './rest-timer/rest-timer';
import { PopUp } from './pop-up/pop-up';
import { RandomWorkout } from './random-workout/random-workout';
import { SwapSheet } from './swap-sheet/swap-sheet';
import { AddSheet } from './add-sheet/add-sheet';
import { ChangeSheet } from './change-sheet/change-sheet';
import { DayDetail } from './day-detail/day-detail';
import { GeneratingScreen } from './frames/generating-screen';
import { HomeScreen } from './frames/home-screen';
import { ProgressFrame } from './frames/progress-frame';
import { TabBar } from './frames/tab-bar';
import { GoalSheet } from './goal-sheet/goal-sheet';
import { MileLock } from './mile-sheet/mile-lock';
import { MileSheet } from './mile-sheet/mile-sheet';
import { RpeInfo } from './rpe-info/rpe-info';
import { SwapNudge } from './swap-nudge/swap-nudge';
import { Toast } from './toast/toast';
import { UpdateBanner } from './update-banner/update-banner';
import { WeekView } from './week-view/week-view';
import { Wizard } from './wizard/wizard';

/**
 * The screens and overlays architecture phase E has moved into Angular components, by the legacy element they take over. After the
 * legacy app boots, LegacyHost puts each component in place of its screen's content; the screen element itself stays,
 * so the legacy navigation (showScreen, the tab bar) shows and hides it as before. The single-file page (what GitHub
 * Pages serves until its source switches) keeps the legacy screens; the e2e's parity holds the two the same.
 */
export const MOVED_SCREENS: readonly (readonly [screenId: string, component: Type<unknown>])[] = [
  ['screenBugs', BugReport],
  ['restFloat', RestTimer],
  ['popOverlay', PopUp],
  ['screenHome', HomeScreen],
  ['swapOverlay', SwapSheet],
  ['addOverlay', AddSheet],
  ['goalOverlay', GoalSheet],
  ['mileOverlay', MileSheet],
  ['mileLockOverlay', MileLock],
  ['swapNudgeOverlay', SwapNudge],
  ['rpeInfoOverlay', RpeInfo],
  ['changeOverlay', ChangeSheet],
  ['randOverlay', RandomWorkout],
  ['toast', Toast],
  ['iaUpdateBanner', UpdateBanner],
  ['screenProgress', ProgressFrame],
  ['screenGenerate', GeneratingScreen],
  ['tabBar', TabBar],
  ['screenWeek', WeekView],
  ['screenWizard', Wizard],
  ['detailOverlay', DayDetail],
];
