// The bug report's logic (src/app/screens/bug-report/bug-report-model.ts, architecture phase E step 1), against the
// legacy script it replaces: the context block, the body posted to Web3Forms, and how a send ends. Every expected string
// is typed here from the legacy submitBug (frontends/app/src/legacy/src/js/bug-report-init.ts), never asked of the model.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BUG_FORM_KEY, BUG_FORM_URL, BUG_SENT_TOAST, BUG_STATUS, bugContextText, bugPayload, submitBugReport } from '../../src/app/screens/bug-report/bug-report-model.ts';

const CONTEXT = {
  build: 'v0.239.8',
  time: '2026-10-12T18:00:00.000Z',
  ua: 'Mozilla/5.0 (iPhone)',
  width: 393,
  height: 852,
  standalone: true,
  url: 'https://bigyerr.github.io/TheBig6V2/',
  program: { name: 'Half Manny', goal: 'balanced', id: 'prog_1' },
  week: 3,
};

describe('the bug report', () => {
  it('appends the context block the legacy script wrote, the program line last', () => {
    assert.equal(
      bugContextText(CONTEXT),
      '\n\n— context —\nbuild: v0.239.8\ntime: 2026-10-12T18:00:00.000Z\nua: Mozilla/5.0 (iPhone)\nviewport: 393x852\nstandalone: yes\n' +
        'url: https://bigyerr.github.io/TheBig6V2/\nprogram: Half Manny / goal balanced / wk 3 / id prog_1',
    );
  });

  it('says no program when there is none, a question mark for a missing field, and no for a browser tab', () => {
    assert.match(bugContextText({ ...CONTEXT, program: null }), /\nprogram: none$/);
    assert.match(bugContextText({ ...CONTEXT, program: {} }), /\nprogram: \? \/ goal \? \/ wk 3 \/ id \?$/);
    assert.match(bugContextText({ ...CONTEXT, standalone: false }), /\nstandalone: no\n/);
  });

  it('posts the text and the context to Web3Forms under the form key, subject and sender the legacy script used', async () => {
    assert.deepEqual(bugPayload('It broke', '\n\nctx'), {
      access_key: '0d660f2b-c9d3-4a37-b944-21150f8fb40c',
      subject: 'The Asylum — Bug Report',
      from_name: 'Asylum Bug Reporter',
      message: 'It broke\n\nctx',
    });
    const calls: { url: string; init: { method: string; headers: Record<string, string>; body: string } }[] = [];
    await submitBugReport('It broke', '\n\nctx', async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ success: true }) };
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.url, 'https://api.web3forms.com/submit');
    assert.equal(BUG_FORM_URL, 'https://api.web3forms.com/submit');
    assert.equal(calls[0]!.init.method, 'POST');
    assert.deepEqual(calls[0]!.init.headers, { 'Content-Type': 'application/json', Accept: 'application/json' });
    assert.deepEqual(JSON.parse(calls[0]!.init.body), { access_key: BUG_FORM_KEY, subject: 'The Asylum — Bug Report', from_name: 'Asylum Bug Reporter', message: 'It broke\n\nctx' });
  });

  it('is sent only on an OK answer whose JSON says success; anything else is a refusal, and a throw a network error', async () => {
    const answer = (ok: boolean, json: () => Promise<unknown>) => async () => ({ ok, json });
    assert.equal(await submitBugReport('x', '', answer(true, async () => ({ success: true }))), 'sent');
    assert.equal(await submitBugReport('x', '', answer(true, async () => ({ success: false }))), 'failed');
    assert.equal(await submitBugReport('x', '', answer(false, async () => ({ success: true }))), 'failed');
    assert.equal(await submitBugReport('x', '', answer(true, async () => { throw new SyntaxError('not JSON'); })), 'failed');
    assert.equal(await submitBugReport('x', '', async () => { throw new TypeError('offline'); }), 'network');
  });

  it('shows the legacy script\'s lines and toast', () => {
    assert.deepEqual(BUG_STATUS.empty, { text: 'Type what went wrong first.', color: 'var(--muted)' });
    assert.deepEqual(BUG_STATUS.sent, { text: 'Sent ✓ — thanks, I got it.', color: 'var(--green)' });
    assert.deepEqual(BUG_STATUS.failed, { text: 'Could not send — try again in a sec.', color: 'var(--red)' });
    assert.deepEqual(BUG_STATUS.network, { text: 'Network error — try again.', color: 'var(--red)' });
    assert.deepEqual(BUG_STATUS.sending, { text: '', color: 'var(--muted)' });
    assert.equal(BUG_SENT_TOAST, 'Bug sent ✓');
  });
});
