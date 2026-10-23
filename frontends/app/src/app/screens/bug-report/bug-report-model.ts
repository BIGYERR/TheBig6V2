// The bug report's logic, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase E,
// step 1: the screen moves from the legacy script's submitBug to the BugReport component). Every string and every branch
// is the legacy script's, word for word: the report goes to Web3Forms with the athlete's text and the app's context.

/** The Web3Forms access key the report is filed under. */
export const BUG_FORM_KEY = '0d660f2b-c9d3-4a37-b944-21150f8fb40c';
/** Where the report is posted. */
export const BUG_FORM_URL = 'https://api.web3forms.com/submit';

/** What the report carries about the app besides the athlete's text. */
export interface BugContext {
  /** The version label, 'v0.239.8'. */
  build: string;
  /** The moment the report is sent, ISO 8601. */
  time: string;
  ua: string;
  width: number;
  height: number;
  /** Whether the app runs from the home screen (display-mode standalone). */
  standalone: boolean;
  url: string;
  /** The active program, or null when there is none. */
  program: { name?: string; goal?: string; id?: string } | null;
  /** The week the athlete is on. */
  week: number | string;
}

/** The context block appended to the athlete's text, as the legacy script wrote it. */
export function bugContextText(c: BugContext): string {
  return (
    '\n\n— context —\n' +
    'build: ' + c.build + '\n' +
    'time: ' + c.time + '\n' +
    'ua: ' + c.ua + '\n' +
    'viewport: ' + c.width + 'x' + c.height + '\n' +
    'standalone: ' + (c.standalone ? 'yes' : 'no') + '\n' +
    'url: ' + c.url + '\n' +
    (c.program
      ? 'program: ' + (c.program.name || '?') + ' / goal ' + (c.program.goal || '?') + ' / wk ' + c.week + ' / id ' + (c.program.id || '?')
      : 'program: none')
  );
}

/** The body posted to Web3Forms. */
export function bugPayload(text: string, context: string): { access_key: string; subject: string; from_name: string; message: string } {
  return { access_key: BUG_FORM_KEY, subject: 'The Asylum — Bug Report', from_name: 'Asylum Bug Reporter', message: text + context };
}

/** How a send ended: filed, refused by the form, or never reached it. */
export type BugOutcome = 'sent' | 'failed' | 'network';

/** The line under the button, and its colour, for each state the legacy script showed. */
export const BUG_STATUS = {
  empty: { text: 'Type what went wrong first.', color: 'var(--muted)' },
  sending: { text: '', color: 'var(--muted)' },
  sent: { text: 'Sent ✓ — thanks, I got it.', color: 'var(--green)' },
  failed: { text: 'Could not send — try again in a sec.', color: 'var(--red)' },
  network: { text: 'Network error — try again.', color: 'var(--red)' },
} as const;

/** The toast a filed report shows. */
export const BUG_SENT_TOAST = 'Bug sent ✓';

/**
 * Posts the report. 'sent' only when the form answered OK and its JSON says success; a body that is not JSON reads as
 * a refusal, as before, and a fetch that throws is a network error.
 */
export async function submitBugReport(
  text: string,
  context: string,
  fetchFn: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; json(): Promise<unknown> }>,
): Promise<BugOutcome> {
  try {
    const r = await fetchFn(BUG_FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(bugPayload(text, context)),
    });
    let j: unknown = {};
    try {
      j = await r.json();
    } catch {
      // A body that is not JSON is a refusal, as the legacy script read it.
    }
    return r.ok && j && (j as { success?: unknown }).success ? 'sent' : 'failed';
  } catch {
    return 'network';
  }
}
