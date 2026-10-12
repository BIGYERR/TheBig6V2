import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SvgEl } from './chart-card-model';
import { SvgAttrs } from './svg-attrs';

/** An SVG drawn from elements (a chart's picture): its viewBox, its inline style, and each element with the legacy attributes. */
export interface SvgPictureSpec {
  viewBox: string;
  style: string;
  els: SvgEl[];
}

/** Draws an SvgPictureSpec, in a box that makes none of its own (architecture phase E, step 16). */
@Component({
  selector: 'ia-svg-picture',
  host: { style: 'display: contents' },
  imports: [SvgAttrs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let p = spec();
  <svg [attr.viewBox]="p.viewBox" [attr.style]="p.style">
    @for (e of p.els; track $index) {
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
  `,
})
export class SvgPicture {
  readonly spec = input.required<SvgPictureSpec>();
}
