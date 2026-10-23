#!/usr/bin/env node
// Claude Code hooks (.claude/settings.json) write Claude's own activity into the shared history, temp/events.log,
// beside the test, build, deploy and server runs: when a session starts, compacts and ends, and when an agent is
// dispatched and finishes, with the transcript to open when something needs explaining.
//
//   2026-10-11 16:20:03.118  claude@61a68a9c            agent     dispatched gatekeeper: Prove the run-log pass
//
// The starts (a session, each prompt you give it, each agent it dispatches) also get one line each in the machine's
// orchestration log (~/Library/Logs/IronAsylum/orchestration.log), with the transcript to open:
//
//   2026-10-11 16:20:01  you     prompt              "run the e2e again" (TheBig6V2)  -> <session transcript>
//   2026-10-11 16:20:03  claude  agent               dispatched gatekeeper: Prove the run-log pass  -> <its folder>
//
// It reads the hook's JSON from stdin, never blocks or fails a tool call (every error is swallowed, exit is always 0),
// and keeps the last raw input of each hook event in temp/hooks/<event>.json for anyone checking what Claude sent.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO, ROOT, checkoutName, ensureRoot, historyEvent, orchestrationEvent } from './runlog.mjs';

function read() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (raw += c));
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(raw));
  });
}

const clip = (s, n = 160) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const where = (p) => (p ? (relative(REPO, p).startsWith('..') ? p : relative(REPO, p) || '.') : '?');

try {
  const input = JSON.parse((await read()) || '{}');
  const event = String(input.hook_event_name ?? 'unknown');
  const id = `claude@${String(input.session_id ?? 'unknown').slice(0, 8)}`;
  const ti = input.tool_input ?? {};
  try {
    ensureRoot();
    mkdirSync(join(ROOT, 'hooks'), { recursive: true });
    writeFileSync(join(ROOT, 'hooks', `${event}.json`), JSON.stringify(input, null, 2) + '\n');
  } catch {
    // The sample is a convenience.
  }
  switch (event) {
    case 'SessionStart':
      historyEvent(id, 'session', `started (${input.source ?? 'startup'}) in ${where(input.cwd)}; transcript ${input.transcript_path ?? '?'}`);
      orchestrationEvent('claude-session', `${id} started (${input.source ?? 'startup'}) in ${checkoutName()}`, input.transcript_path, 'you');
      break;
    case 'UserPromptSubmit':
      // Background-task notices and other messages Claude Code itself delivers arrive here too; only a person's
      // prompt is an orchestration start.
      if (!/^\s*<(task-notification|system-reminder|agent-message|local-command|command-)/.test(String(input.prompt ?? ''))) {
        orchestrationEvent('prompt', `"${clip(input.prompt, 120)}" (${id}, ${checkoutName()})`, input.transcript_path, 'you');
      }
      break;
    case 'SessionEnd':
      historyEvent(id, 'session', `ended (${input.reason ?? 'unknown reason'})`);
      break;
    case 'PreCompact':
      historyEvent(id, 'session', `compacting the conversation (${input.trigger ?? 'unknown trigger'})`);
      break;
    case 'PreToolUse':
      orchestrationEvent(
        'agent',
        `dispatched ${ti.subagent_type ?? 'general-purpose'}: ${clip(ti.description, 100)} (${id}, ${checkoutName()})`,
        input.transcript_path ? String(input.transcript_path).replace(/\.jsonl$/, '/subagents/') : undefined,
        'claude',
      );
      historyEvent(
        id,
        'agent',
        `dispatched ${ti.subagent_type ?? 'general-purpose'}${ti.model ? ` (${ti.model})` : ''}${ti.run_in_background === false ? '' : ', background'}: ${clip(ti.description)}`,
      );
      break;
    case 'SubagentStop':
      historyEvent(
        id,
        'agent',
        `${input.agent_type ?? 'agent'} finished${input.agent_id ? ` (${clip(input.agent_id, 24)})` : ''}; transcript ${input.agent_transcript_path ?? input.transcript_path ?? '?'}`,
      );
      break;
    default:
      historyEvent(id, 'claude', event);
  }
} catch {
  // A hook never fails Claude's work.
}
process.exit(0);
