// The wizard's cardio goal step rig for tests/integration/pace-wizard.test.js (lifted from the legacy gate
// g223_d183_safepace.js). It renders the step with the production renderer and reads what an athlete would see:
//   * getElementById keeps one element per id until a render clears them. The four nodes the step's repaint owns
//     (#progLenLine, #paceDisplayLine, #paceFeasLine, #raceDateFeedback) are born holding a sentinel, so a node nobody
//     painted is visible as such;
//   * an input stub takes its value attribute from the rendered HTML, as a browser does;
//   * the rendered text is #wizardBody with each painted node's live content put back in (the template's own content
//     where it was never painted, nothing where it is display:none), SVG and tags stripped;
//   * an inline handler is lifted from the rendered HTML and run as the browser would run it.
// It holds mechanics only; every expected sentence stays in the test file.
import type { App } from './app.ts';

/** An element stub of the harness document, as the rig dresses it: what the step's renderer and handlers touch. */
interface StubEl {
  id: string;
  innerHTML: string;
  textContent?: string;
  value?: string;
  style: { display: string };
  classList: { add(c: string): void; remove(c: string): void; toggle(c: string, f?: boolean): void; contains(c: string): boolean };
}

const PAINTED = ['progLenLine', 'paceDisplayLine', 'paceFeasLine', 'raceDateFeedback'];
const SENT = (id: string): string => 'PACEWIZSENTINEL:' + id;
const SENT_DISP = 'PACEWIZSENTINEL';
const openTagRe = (id: string): RegExp => new RegExp('<(\\w+)\\b[^>]*\\bid="' + id + '"[^>]*>');
const txt = (h: unknown): string =>
  String(h || '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<\/?(?:div|p|br|li|ul|ol|h\d|section)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

function wizardRig(IA: App) {
  const doc = IA.window.document;
  const reg = new Map<string, StubEl>();
  const baseGet = doc.getElementById;
  const bodyHTML = (): string => (reg.has('wizardBody') ? String(reg.get('wizardBody')!.innerHTML || '') : '');
  doc.getElementById = function (id: string): StubEl {
    if (!reg.has(id)) {
      const el: StubEl = baseGet.call(doc, id);
      el.id = id;
      const cls = new Set<string>();
      el.classList = {
        add: (c) => cls.add(c),
        remove: (c) => cls.delete(c),
        toggle: (c, f) => ((f === undefined ? !cls.has(c) : f) ? cls.add(c) : cls.delete(c)),
        contains: (c) => cls.has(c),
      };
      if (PAINTED.includes(id)) {
        el.innerHTML = SENT(id);
        el.style.display = SENT_DISP;
      }
      const tag = openTagRe(id).exec(bodyHTML());
      if (tag) {
        const v = /\bvalue="([^"]*)"/.exec(tag[0]);
        if (v) el.value = v[1];
      }
      reg.set(id, el);
    }
    return reg.get(id)!;
  };
  IA.eval('showToast = function(){}');
  const painted = (id: string): boolean => reg.has(id) && reg.get(id)!.innerHTML !== SENT(id);
  const inBody = (id: string): boolean => openTagRe(id).test(bodyHTML());
  /** Puts the sentinel back in the four repaint nodes, so the next handler has to paint them. */
  const seed = (): void => {
    for (const id of PAINTED) {
      const el: StubEl = doc.getElementById(id);
      el.innerHTML = SENT(id);
      el.style.display = SENT_DISP;
    }
  };
  function composedHTML(): string {
    let b = bodyHTML();
    for (const id of PAINTED) {
      const m = new RegExp('(<(\\w+)\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</\\2>)').exec(b);
      if (!m) continue;
      const el = reg.get(id);
      const dispSet = !!el && el.style.display !== SENT_DISP;
      const hidden = dispSet ? el.style.display === 'none' : /display:\s*none/.test(m[1]);
      const inner = hidden ? '' : el && painted(id) ? String(el.innerHTML) : m[3];
      b = b.slice(0, m.index) + m[1] + inner + m[4] + b.slice(m.index + m[0].length);
    }
    return b;
  }
  const nodeHTML = (id: string): string | null => {
    const m = new RegExp('(<(\\w+)\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</\\2>)').exec(composedHTML());
    return m ? m[3] : null;
  };
  /** A repaint node's whole live content: '' when hidden, the template's content when never painted. */
  function liveNode(id: string): string | null {
    const t = openTagRe(id).exec(bodyHTML());
    if (!t) return null;
    const el = reg.get(id);
    const hidden = el && el.style.display !== SENT_DISP ? el.style.display === 'none' : /display:\s*none/.test(t[0]);
    return hidden ? '' : el && painted(id) ? String(el.innerHTML) : nodeHTML(id);
  }
  const headerOf = (t: string): string | null => {
    const m = /Program length: \d+ weeks?\.?[^.]*\./.exec(t);
    return m ? m[0] : null;
  };
  const colorOf = (h: unknown): string | null => {
    const m = /^\s*<div style="color:(var\(--[\w-]+\))/.exec(String(h || ''));
    return m ? m[1]! : null;
  };
  /** What the step shows: all of it, its text, the length header, the race-date card and the feasibility frame. */
  function screen() {
    const all = composedHTML();
    const card = liveNode('raceDateFeedback');
    const feas = liveNode('paceFeasLine');
    return { all, text: txt(all), header: headerOf(txt(all)), card, cardText: txt(card), cardColor: colorOf(card), feas, feasText: txt(feas) };
  }
  const deDash = (h: unknown): string => String(h || '').replace(/&mdash;|&#8212;|&#x2014;/gi, '—');
  /** The step's rendered text plus every node a handler wrote after the render (innerHTML or textContent). */
  function sweepText(): string {
    let t = txt(deDash(composedHTML()));
    for (const [id, el] of reg) {
      if (id === 'wizardBody' || PAINTED.includes(id)) continue;
      const h = String(el.innerHTML || '');
      const c = String(el.textContent || '');
      if (h) t += ' ' + txt(deDash(h));
      if (c) t += ' ' + c;
    }
    return t;
  }
  function renderStep(step: string, flush?: boolean): void {
    reg.clear();
    IA.eval('wizardStep = WIZARD_STEPS.indexOf(' + JSON.stringify(step) + '); renderWizardStep();');
    if (flush) IA.flushTimers();
  }
  const drain = () => {
    for (let k = 0; k < 20 && IA.flushTimers() > 0; k++);
  };
  /** Every inline handler body in the rendered step that matches `re` (its first group). */
  function lifted(re: RegExp): string[] {
    const all: string[] = [];
    const g = new RegExp(re.source, 'g');
    let m;
    while ((m = g.exec(bodyHTML()))) all.push(m[1]!);
    return all;
  }
  /** Runs a lifted handler body with `this` bound as the browser binds it. */
  function runHandler(code: string, thisObj: unknown): void {
    IA.ctx.__PACEWIZ_THIS = thisObj;
    IA.eval('(function(){' + code + '}).call(__PACEWIZ_THIS)');
  }
  return { reg, doc, bodyHTML, painted, inBody, seed, composedHTML, liveNode, screen, sweepText, renderStep, drain, lifted, runHandler, openTagRe, colorOf, headerOf };
}

export { wizardRig, txt, PAINTED };