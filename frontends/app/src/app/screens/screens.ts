import type { Type } from '@angular/core';
import { BugReport } from './bug-report/bug-report';
import { RestTimer } from './rest-timer/rest-timer';
import { PopUp } from './pop-up/pop-up';
import { ProgramList } from './program-list/program-list';
import { SwapSheet } from './swap-sheet/swap-sheet';
import { AddSheet } from './add-sheet/add-sheet';

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
  ['progList', ProgramList],
  ['swapOverlay', SwapSheet],
  ['addOverlay', AddSheet],
];
