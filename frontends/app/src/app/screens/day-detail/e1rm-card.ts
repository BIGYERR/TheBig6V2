import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type E1rmCard as Card, epley } from './day-detail-model';

/** A stored program, as far as saving a test max reads it. */
interface MaxProgram {
  id: string;
  cfg?: Record<string, unknown>;
}

/**
 * The test-week 1RM calculator (architecture phase E, step 24), in place of the legacy e1rmCalcHTML, e1rmCalcUpdate and
 * saveTestMax: the test set's weight and reps (prefilled from the logged set), the Epley estimate, and saving it as the
 * lift's new max for the next block. The estimate reads 0 until a field changes, as the legacy did; saving writes the
 * max into the stored program and the active one, with no rebuild, as before.
 */
@Component({
  selector: 'ia-e1rm-card',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let c = card();
  <div class="e1rm" id="e1rmCard">
    <div class="e1rm-hd">Estimated 1RM <small>from your test set</small></div>
    <div class="e1rm-row">
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was: a tap on it focuses nothing -->
      <div class="e1rm-field"><label>{{ 'Weight (' + c.unit + ')' }}</label><input #w id="e1w" type="number" inputmode="decimal" [value]="c.weight" (input)="update(w.value, r.value)"></div>
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was: a tap on it focuses nothing -->
      <div class="e1rm-field"><label>Reps</label><select #r id="e1r" (change)="update(w.value, r.value)">@for (i of reps; track i) {<option [selected]="i === c.reps">{{ i }}</option>}</select></div>
    </div>
    <div class="e1rm-out"><span class="lbl">Estimated 1RM</span><span class="val" id="e1out">{{ estimate() + ' ' }}<span>{{ c.unit }}</span></span></div>
    <button class="e1rm-save" id="e1save" [style.display]="saved() ? 'none' : null" (click)="save(w.value, r.value)">{{ 'Save as new ' + c.liftLabel + ' max' }}</button>
    <div class="e1rm-saved" id="e1saved" [style.display]="saved() ? 'block' : null">{{ saved() }}</div>
    <div class="e1rm-hint">Experienced with heavy singles and have a spotter? A single at RPE 9.5 works too. Enter it at 1 rep.</div>
  </div>
  `,
})
export class E1rmCard {
  private readonly bridge = inject(LegacyBridge);
  readonly card = input.required<Card>();
  protected readonly reps = [1, 2, 3, 4, 5];
  protected readonly estimate = signal(0);
  protected readonly saved = signal('');

  /** The legacy e1rmCalcUpdate: the estimate from the two fields. */
  protected update(weight: string, reps: string): number {
    const v = epley(parseFloat(weight) || 0, parseInt(reps) || 1);
    this.estimate.set(v);
    return v;
  }

  /** The legacy saveTestMax: the estimate as the lift's max in the stored program and the active one, then the note. */
  protected save(weight: string, reps: string): void {
    const v = this.update(weight, reps);
    if (!(v > 0)) return;
    const b = this.bridge;
    const lift = this.card().lift;
    const programs = b.call<MaxProgram[]>('getPrograms');
    const p = programs.filter((x) => x && x.id === b.global<string | null>('activeProgId'))[0];
    if (p && p.cfg) {
      p.cfg[lift] = v;
      const active = b.global<MaxProgram | null>('activeProg');
      if (active && active.cfg) active.cfg[lift] = v;
      b.call('savePrograms', programs);
    }
    this.saved.set('Saved. Your next block anchors off ' + v + ' ' + this.card().unit + '.');
  }
}
