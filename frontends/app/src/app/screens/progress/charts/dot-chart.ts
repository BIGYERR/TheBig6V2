import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { DotSpec } from './dot-chart-model';

/**
 * The weekly dot chart (architecture phase E, step 14), in place of the legacy buildDotChart's markup: a card with the
 * title in the series colour, the SVG (gridlines and their values, the dashed line between logged weeks, a dot and its
 * halo on each, the week labels), and the total and the peak. Laid in a box that makes none of its own, as the legacy
 * markup sat in the screen's column.
 */
@Component({
  selector: 'ia-dot-chart',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let s = spec();
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">
    <div [attr.style]="'font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:' + s.color + ';margin-bottom:10px'" [innerHTML]="title()"></div>
    <svg [attr.viewBox]="'0 0 ' + s.width + ' ' + s.height" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;overflow:visible">
      @for (g of s.grid; track $index) {
        <line [attr.x1]="s.left" [attr.y1]="g.y" [attr.x2]="s.right" [attr.y2]="g.y" stroke="rgba(var(--ink-rgb),0.06)" stroke-width="1"/>
        <text [attr.x]="s.left - 4" [attr.y]="g.y + 4" fill="rgba(var(--ink-rgb),0.3)" font-size="8" text-anchor="end" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">{{ g.label }}</text>
      }
      <path [attr.d]="s.path" [attr.stroke]="s.color" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.6"/>
      @for (p of s.points; track $index) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" [attr.fill]="s.color" opacity="0.9"/>
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="7" [attr.fill]="s.color" opacity="0.15"/>
      }
      @for (l of s.xLabels; track $index) {
        <text [attr.x]="l.x" [attr.y]="s.xLabelY" fill="rgba(var(--ink-rgb),0.3)" font-size="8" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">{{ l.text }}</text>
      }
    </svg>
    <div style="font-size:11px;color:var(--muted);margin-top:4px">Total logged: <b [attr.style]="'color:' + s.color">{{ s.total }} {{ s.unit }}</b> · Peak week: <b [attr.style]="'color:' + s.color">{{ s.peak }} {{ s.unit }}</b></div>
  </div>
  `,
})
export class DotChart {
  private readonly sanitizer = inject(DomSanitizer);
  readonly spec = input.required<DotSpec>();
  protected readonly title = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.spec().title));
}
