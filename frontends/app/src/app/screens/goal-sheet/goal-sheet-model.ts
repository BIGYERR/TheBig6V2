// The change-a-goal sheet, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 7: the sheet's body moves from the legacy renderGoalSheet to the GoalSheet component). The draft (the program,
// the sport, the pick, the typed targets) stays the legacy `_goalDraft`, and choosing, typing and committing are still
// the legacy selectGoalOpt, _goalSetInput and commitGoalChange; this decides what the body shows, each string the legacy
// renderGoalSheet's.

/** A goal a sport offers (the legacy CARDIO_GOALS_BY_TYPE entries). */
export interface GoalChoice {
  id: string;
  label: string;
  desc: string;
}

/** The legacy draft. */
export interface GoalDraft {
  progId: string | null;
  sport: string | null;
  sel: string | null;
  inputs: { targetDist?: string; paceUnit?: string; targetMins?: string; targetSecs?: string };
}

/** One option row. */
export interface GoalOptionView {
  id: string;
  label: string;
  desc: string;
  current: boolean;
  selected: boolean;
  /** A bigger goal than the current build's (it says so under the description). */
  up: boolean;
}

/** The decision panel under the options, once a goal is picked. */
export interface GoalDecision {
  up: boolean;
  title: string;
  body: string;
  /** Which targets the goal needs typed: distance and time, time only, or none. */
  inputs: 'pace' | 'time' | null;
  values: { targetDist: string; paceUnit: string; targetMins: string; targetSecs: string };
  commitLabel: string;
  keepLabel: string;
}

/** The body: its heading, the options and the decision. */
export interface GoalSheetView {
  heading: string;
  options: GoalOptionView[];
  decision: GoalDecision | null;
}

/** What renderGoalSheet read. */
export interface GoalInput {
  draft: GoalDraft;
  sportLabel: string;
  /** The program's current goal for the sport, or null. */
  current: { id?: string; label?: string } | null;
  /** The program's path ('both' leaves out the hybrid-excluded goals). */
  path: string | undefined;
  choices: GoalChoice[];
  excluded: ReadonlySet<string>;
  rank: Readonly<Record<string, number>>;
  needsInputs: ReadonlySet<string>;
  /** Whether the program has started and is past its first week, and the week it is in. */
  started: boolean;
  week: number;
}

/** The body, as the legacy renderGoalSheet drew it. */
export function goalSheetView(g: GoalInput): GoalSheetView {
  const curId = (g.current && g.current.id) || null;
  const curRank = (curId && g.rank[curId]) || 2;
  const opts = g.choices.filter((c) => g.path !== 'both' || !g.excluded.has(c.id));
  const sel = g.draft.sel ? opts.find((c) => c.id === g.draft.sel) || null : null;
  const options = opts.map((c) => ({
    id: c.id,
    label: c.label,
    desc: c.desc,
    current: c.id === curId,
    selected: !!sel && c.id === sel.id,
    up: (g.rank[c.id] || 1) > curRank,
  }));
  let decision: GoalDecision | null = null;
  if (sel) {
    const up = (g.rank[sel.id] || 1) > curRank;
    const i = g.draft.inputs;
    decision = {
      up,
      title: up ? sel.label + ' is a step up' : 'Switch to ' + sel.label,
      body: up
        ? 'You would drop into ' + (g.started ? 'week ' + g.week + ' of a bigger build' : 'a bigger build') +
          ' without the early weeks under you. That is a real jump in training load. If the goal matters, a fresh program builds it right.'
        : 'Past weeks stand as trained. Your ' + g.sportLabel.toLowerCase() + ' work rebuilds from this week forward.' +
          (g.started ? ' This week may finish mixed. Next week is fully on the new goal.' : ''),
      inputs: g.needsInputs.has(sel.id) ? (sel.id === 'run_pace_goal' ? 'pace' : 'time') : null,
      values: { targetDist: i.targetDist || '', paceUnit: i.paceUnit || 'mi', targetMins: i.targetMins || '', targetSecs: i.targetSecs || '' },
      commitLabel: up ? 'Switch anyway' : 'Make the switch',
      keepLabel: up ? 'Stay the course' : 'Keep ' + (g.current && g.current.label ? g.current.label : 'current'),
    };
  }
  return { heading: 'Change ' + g.sportLabel.toLowerCase() + ' goal', options, decision };
}

