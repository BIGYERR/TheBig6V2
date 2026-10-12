import { Directive, ElementRef, inject, input, type OnChanges, Renderer2 } from '@angular/core';

/**
 * Writes a chart element's attributes as the legacy builder wrote them: every name and string value in a CardSpec
 * element, in order (architecture phase E, step 15). Synchronous, so a chart drawn by detectChanges is whole at once.
 */
@Directive({ selector: '[iaSvgAttrs]' })
export class SvgAttrs implements OnChanges {
  private readonly el = inject<ElementRef<Element>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  readonly iaSvgAttrs = input.required<Record<string, string>>();

  ngOnChanges(): void {
    const a = this.iaSvgAttrs();
    for (const k of Object.keys(a)) this.renderer.setAttribute(this.el.nativeElement, k, a[k]!);
  }
}
