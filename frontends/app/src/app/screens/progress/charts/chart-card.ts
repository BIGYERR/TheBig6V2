import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { CardSpec } from './chart-card-model';
import { SvgAttrs } from './svg-attrs';

/**
 * A Progress chart card (architecture phase E, step 15), in place of the markup the legacy chart builders wrote: the
 * title in the chart's colour, the head, the SVG element by element with the legacy attributes, the body and the
 * footer. Laid in a box that makes none of its own, as the legacy markup sat in the screen's column.
 */
@Component({
  selector: 'ia-chart-card',
  host: { style: 'display: contents' },
  imports: [SvgAttrs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let c = spec();
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">
    <div [attr.style]="'font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:' + c.color + ';margin-bottom:' + c.titleGap + 'px'" [innerHTML]="markup().title"></div>
    @if (markup().head; as h) {
      <div style="display:contents" [innerHTML]="h"></div>
    }
    @if (c.svg; as g) {
      <svg [attr.viewBox]="'0 0 ' + g.w + ' ' + g.h" style="width:100%;height:auto;overflow:visible">
        @for (e of g.els; track $index) {
          @switch (e.el) {
            @case ('line') { <line [iaSvgAttrs]="e.a" /> }
            @case ('rect') { <rect [iaSvgAttrs]="e.a" /> }
            @case ('circle') { <circle [iaSvgAttrs]="e.a" /> }
            @case ('path') { <path [iaSvgAttrs]="e.a" /> }
            @case ('polygon') { <polygon [iaSvgAttrs]="e.a" /> }
            @case ('text') { <text [iaSvgAttrs]="e.a">{{ e.text }}</text> }
          }
        }
      </svg>
    }
    @if (markup().body; as b) {
      <div style="display:contents" [innerHTML]="b"></div>
    }
    @if (markup().foot; as f) {
      <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5" [innerHTML]="f"></div>
    }
  </div>
  `,
})
export class ChartCard {
  private readonly sanitizer = inject(DomSanitizer);
  readonly spec = input.required<CardSpec>();
  protected readonly markup = computed(() => {
    const c = this.spec();
    const html = (s: string | null) => (s === null ? null : this.sanitizer.bypassSecurityTrustHtml(s));
    return { title: html(c.title)!, head: html(c.head), body: html(c.body), foot: html(c.foot) };
  });
}
