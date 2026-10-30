import { afterNextRender, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { confetti, type PopAction, type PopOptions, type PopStat, type PopTier, popView } from './pop-up-model';

/**
 * The celebration pop-up (architecture phase E, step 3), in place of the legacy popFire inside #popOverlay. The markup is
 * the legacy one, element for element. The pools, the tier config and the line pickers stay in the legacy script; the
 * legacy calls (popFire from a closed day, a streak, the season, a reminder, the injury check-ins and Random Workout;
 * popClose; popDismissBg from the overlay's own onclick) reach this component through LegacyBridge.provide. The icon and
 * a stat's label are the app's own markup (an icon's SVG), kept as they are; an action button runs the handler code its
 * caller wrote, as the legacy onclick attribute did.
 */
@Component({
  selector: 'ia-pop-up',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="pop-modal" id="popModal" #modal>
    <span class="pop-icon" id="popIcon" #icon>🎉</span>
    <div [class]="kickerClass()" id="popKicker">{{ kicker() }}</div>
    <div class="pop-msg" id="popMsg">{{ msg() }}</div>
    <div class="pop-sub" id="popSub" [style.display]="sub() ? 'block' : 'none'">{{ sub() }}</div>
    <div class="pop-stat-row" id="popStatRow" [style.display]="statsDisplay()">@for (s of stats(); track $index) {<div class="pop-stat"><div [class]="'pop-stat-num ' + (s.cls || '')">{{ s.n }}</div><div class="pop-stat-lbl" [innerHTML]="markup(s.l)"></div></div>}</div>
    <div [class]="actionsClass()" id="popActions">@for (a of actions(); track $index) {<button [class]="'pop-act ' + (a.cls || '')" (click)="act(a)">{{ a.label }}</button>}</div>
    <div class="pop-brand">The Asylum</div>
  </div>
  `,
})
export class PopUp {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly modal = viewChild.required<ElementRef<HTMLElement>>('modal');
  private readonly icon = viewChild.required<ElementRef<HTMLElement>>('icon');

  protected readonly kickerClass = signal('pop-kicker');
  protected readonly kicker = signal('Workout complete');
  protected readonly msg = signal('—');
  protected readonly sub = signal('');
  protected readonly stats = signal<PopStat[]>([]);
  protected readonly statsDisplay = signal<string | null>(null);
  protected readonly actionsClass = signal('pop-actions');
  protected readonly actions = signal<PopAction[]>([]);

  constructor() {
    this.bridge.provide('popFire', (tier: string, opts?: PopOptions) => this.fire(tier, opts));
    this.bridge.provide('popClose', () => this.close());
    this.bridge.provide('popDismissBg', (e: Event) => {
      if ((e.target as Element | null)?.id === 'popOverlay') this.close();
    });
    // A tap on the card stays on the card, as the legacy onclick="event.stopPropagation()" kept it.
    afterNextRender(() => this.modal().nativeElement.addEventListener('click', (e) => e.stopPropagation()));
  }

  protected markup(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected act(a: PopAction): void {
    this.bridge.run(a.onclick);
  }

  private close(): void {
    document.getElementById('popOverlay')?.classList.remove('show');
  }

  private fire(tier: string, opts?: PopOptions): void {
    const POP_CFG = this.bridge.global('POP_CFG') as Record<string, PopTier>;
    const ICONS = this.bridge.global('ASY_ICON_PATHS');
    const v = popView(tier, opts, {
      tier: (name) => POP_CFG[name],
      isIcon: (name) => Object.prototype.hasOwnProperty.call(ICONS, name),
      pick: (t, week, dayKey) => this.bridge.call('popPick', t, week, dayKey),
      dismissText: () => this.bridge.call('popDismissText'),
    });
    const icon = this.icon().nativeElement;
    if (v.icon.svg) icon.innerHTML = this.bridge.call('asyIcon', v.icon.name, 52);
    else icon.textContent = v.icon.name;
    this.kicker.set(v.kicker);
    this.kickerClass.set(v.kickerClass);
    this.msg.set(v.msg);
    this.sub.set(v.sub);
    this.stats.set(v.stats);
    this.statsDisplay.set(v.stats.length ? 'flex' : 'none');
    this.actionsClass.set(v.actionsClass);
    this.actions.set(v.actions);
    // The card shows the new content at once, as the legacy writes did, before the overlay opens.
    this.cdr.detectChanges();
    const modal = this.modal().nativeElement;
    modal.className = v.modalClass;
    void modal.offsetWidth;
    document.getElementById('popOverlay')?.classList.add('show');
    this.burst(v.confetti);
  }

  private burst(count: number): void {
    const box = document.getElementById('popConfetti');
    if (!box) return;
    for (const c of confetti(count, Math.random, this.bridge.global('POP_KNICKS'))) {
      const p = document.createElement('i');
      p.style.left = c.left;
      p.style.animationDuration = c.duration;
      p.style.animationDelay = c.delay;
      if (c.trophy) {
        p.textContent = '🏆';
        p.style.background = 'none';
        p.style.width = 'auto';
        p.style.height = 'auto';
        p.style.fontSize = c.fontSize!;
        p.style.lineHeight = '1';
        p.style.transform = c.rotate;
      } else {
        p.style.background = c.background!;
        p.style.transform = c.rotate;
        if (c.round) p.style.borderRadius = '50%';
      }
      box.appendChild(p);
      setTimeout(() => p.remove(), 3600);
    }
  }
}
