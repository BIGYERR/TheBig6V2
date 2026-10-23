import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardShell } from './card-shell';
import type { LedgerView } from './ledger-model';
import { SvgPicture } from './svg-picture';

/**
 * The Lift Ledger (architecture phase E, step 16), in place of the legacy buildLedgerCards markup: Main Lifts, the Range
 * Ladder and Other Accessory Work, each drawn only when it has rows, in the legacy markup. Laid in a box that makes
 * none of its own, as the legacy markup sat in the screen's column.
 */
@Component({
  selector: 'ia-ledger-cards',
  host: { style: 'display: contents' },
  imports: [CardShell, SvgPicture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let v = view();
  @if (v.mains; as m) {
    <ia-card-shell [title]="m.title" color="var(--lift)" [foot]="m.foot">
      @for (b of m.blocks; track $index) {
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.3">{{ b.name }}</div><div style="font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--lift);white-space:nowrap">{{ b.top }}</div></div>
          <div style="font-size:11px;color:var(--muted);margin:2px 0 8px">{{ 'Opened at ' }}<b style="color:var(--text)">{{ b.opened }}</b>{{ b.afterOpened }}@if (b.gain) {<b style="color:var(--lift)">{{ b.gain }}</b>{{ b.afterGain }}}</div>
          @if (b.chart; as c) {
            <ia-svg-picture [spec]="c" />
          }
        </div>
      }
    </ia-card-shell>
  }
  @if (v.ladder; as l) {
    <ia-card-shell [title]="l.title" color="var(--lift)" [foot]="l.foot">
      <div style="display:flex;align-items:baseline;gap:9px;margin-bottom:2px"><div [attr.style]="'font-family:var(--font-display);font-size:30px;font-weight:700;letter-spacing:-0.02em;color:' + (l.ready ? 'var(--signal)' : 'var(--muted)') + ';line-height:1.05'">{{ l.ready }}</div><div style="font-size:13px;color:var(--text);font-weight:600">ready to move up</div></div>
      <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">@if (l.ups) {{{ 'You have stepped the weight up ' }}<b style="color:var(--text)">{{ l.ups + ' time' + (l.ups === 1 ? '' : 's') }}</b>{{ ' across these lifts this block. Hit the top of the range on every set, then add weight and start back at the bottom.' }}} @else {Hit the top of the range on every set, then add weight and start back at the bottom.}</div>
      @for (r of l.rows; track $index) {
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;color:var(--text);font-weight:500;line-height:1.3">{{ r.name }}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px"><b style="color:var(--text)">{{ r.weight }}</b>{{ r.detail }}</div>
            <div style="margin-top:3px">@if (r.ready) {<span style="font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--signal)">Add weight</span>} @else {<span style="font-size:10px;color:var(--muted)">{{ r.toGo + ' to go' }}</span>}</div>
          </div>
          <div style="flex-shrink:0"><ia-svg-picture [spec]="r.track" /></div>
        </div>
      }
    </ia-card-shell>
  }
  @if (v.other; as o) {
    <ia-card-shell [title]="o.title" color="var(--muted)" [foot]="o.foot">
      @for (r of o.rows; track $index) {
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><div style="font-size:12px;color:var(--text)">{{ r.name }}</div><div style="font-size:10px;color:var(--muted);white-space:nowrap">{{ r.meta }}</div></div>
      }
    </ia-card-shell>
  }
  `,
})
export class LedgerCards {
  readonly view = input.required<LedgerView>();
}
