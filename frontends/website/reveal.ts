import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

// Fades a block up the first time it scrolls into view (styles.css, `.reveal` and `.reveal.in`). With no
// IntersectionObserver, or with reduced motion asked for, it is simply shown.
@Directive({ selector: '[iaReveal]', host: { class: 'reveal' } })
export class Reveal {
  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    io.observe(el);
    inject(DestroyRef).onDestroy(() => io.disconnect());
  }
}
