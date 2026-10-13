import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { completedKey, esc, getWildcardDone, saveWildcardDone } from './storage.ts';
import { _setCurrentRandIdx, activeProg, showToast } from './rest-day-shell.ts';
import { getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { _setCurrentRandDayKey, _setLastRandIdx, lastRandIdx } from './wizard.ts';
import { buildSectionsHTML, dayBeforeStart, renderWeekView } from './week-view-sections.ts';
import { computeStreak, popFire } from './popups-streaks-reminders.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// RANDOM POOLS - 30+ per goal
const RAND_POOLS={
  strength:[
    {title:'Max Effort Bench',sections:[{label:'Main',items:[{name:'Barbell bench press',detail:'Work to 1–3RM, then 3×3 @ RPE 9'}]},{label:'Accessory',superset:true,items:[{name:'Dumbbell incline press',detail:'3×8'},{name:'Barbell row',detail:'3×8'}]},{label:'Core',items:[{name:'Ab wheel rollouts',detail:'4×8'},{name:'Plank hold',detail:'3×40 sec'}]}]},
    {title:'Max Effort Squat',sections:[{label:'Main',items:[{name:'Back squat',detail:'Work to heavy 3RM, then 3×3 @ RPE 9'}]},{label:'Accessory',superset:true,items:[{name:'Dumbbell Bulgarian split squat',detail:'3×6 each'},{name:'Kettlebell goblet squat',detail:'3×12'}]}]},
    {title:'Deadlift PR Day',sections:[{label:'Main',items:[{name:'Deadlift',detail:'Build to heavy single — 3–4 warm-up sets, max 2 attempts'}]},{label:'Back volume',items:[{name:'Barbell row',detail:'4×6'},{name:'Chinups',detail:'4×5'}]}]},
    {title:'Heavy 5x5',sections:[{label:'Big 3 @ RPE 8',items:[{name:'Barbell bench press',detail:'5×5 @ RPE 8'},{name:'Back squat',detail:'5×5 @ RPE 8'},{name:'Deadlift',detail:'5×5 @ RPE 8'}]}]},
    {title:'3x3 Heavy Day',sections:[{label:'4 min rest between sets',items:[{name:'Barbell bench press',detail:'3×3 @ RPE 9'},{name:'Back squat',detail:'3×3 @ RPE 9'},{name:'Deadlift',detail:'3×3 @ RPE 9'}]}]},
    {title:'Speed Bench',sections:[{label:'Bar speed focus — explosive up',items:[{name:'Barbell bench press',detail:'8×3, 45s rest — explosive, sub-max (bar speed)'},{name:'Barbell row',detail:'4×8'}]},{label:'Accessory',superset:true,items:[{name:'Dips',detail:'3×10'},{name:'L-sit chinups',detail:'3×5'}]}]},
    {title:'Pause Lifts',sections:[{label:'2-sec pause at bottom of every rep',items:[{name:'Paused back squat',detail:'4×4 @ RPE 7.5'},{name:'Paused barbell bench press',detail:'4×4 @ RPE 7.5'},{name:'Paused deadlift (below knee)',detail:'3×3 @ RPE 7.5'}]}]},
    {title:'Press Pyramid',sections:[{label:'Bench — add weight each set',items:[{name:'Barbell bench press',detail:'10/8/6/4/2 — heavier each set'}]},{label:'OHP pyramid',items:[{name:'Barbell overhead press',detail:'8/6/4/6/8 — peak set 3'}]},{label:'Finisher',items:[{name:'Dips',detail:'3×12'},{name:'Dumbbell lateral raise',detail:'3×15'}]}]},
    {title:'Heavy Upper',sections:[{label:'Press',items:[{name:'Barbell bench press',detail:'6×3 @ RPE 9'},{name:'Barbell overhead press',detail:'4×5 @ RPE 8'}]},{label:'Pull',items:[{name:'Weighted chinups',detail:'5×3'},{name:'Barbell row',detail:'4×5'}]}]},
    {title:'Posterior Chain',sections:[{label:'Main',items:[{name:'Deadlift',detail:'5×3 @ RPE 9'},{name:'Kettlebell swing',detail:'5×20'}]},{label:'Accessory',superset:true,items:[{name:'Barbell Romanian deadlift',detail:'3×10'},{name:'Kettlebell single-leg deadlift',detail:'3×8 each'}]}]},
    {title:'The Juggernaut',sections:[{label:'AMRAP top set @ RPE 8',items:[{name:'Barbell bench press',detail:'10/10/10/AMRAP @ RPE 8'},{name:'Back squat',detail:'10/10/10/AMRAP @ RPE 8'}]}]},
    {title:'Grip & Rip',sections:[{label:'Pull',items:[{name:'Deadlift',detail:'5×3 @ RPE 9'},{name:'Barbell row',detail:'5×5'}]},{label:'Grip circuit',superset:true,items:[{name:'Farmer carry',detail:'3×50 yards'},{name:'Hanging hold',detail:'Max time'},{name:'L-sit chinups',detail:'5 reps'}]}]},
    {title:'Squat Clinic',sections:[{label:'Volume',items:[{name:'Back squat',detail:'5×5 @ RPE 8'},{name:'Paused squat (2 sec)',detail:'3×5 @ RPE 7'}]},{label:'Knee stability',superset:true,items:[{name:'Kettlebell goblet squat',detail:'4×15'},{name:'Wall sit',detail:'3×45 sec'}]}]},
    {title:'Volume King',sections:[{label:'High volume short rest (60s)',items:[{name:'Barbell bench press',detail:'10×3 @ RPE 7.5'},{name:'Barbell row',detail:'10×3'},{name:'Back squat',detail:'5×8 @ RPE 7'}]}]},
    {title:'Snatch Grip Pulls',sections:[{label:'Main',items:[{name:'Snatch grip deadlift',detail:'4×4 @ RPE 7 — wider grip'},{name:'Deadlift',detail:'3×3 heavy'}]},{label:'Back',superset:true,items:[{name:'Barbell row',detail:'4×6'},{name:'Chinups',detail:'4×5'}]}]},
    {title:'Bench PR Attempt',sections:[{label:'Go for it',items:[{name:'Barbell bench press',detail:'Work to 1RM — 4–5 build sets, max 3 top attempts'}]},{label:'Back off',items:[{name:'Barbell bench press',detail:'3×5 @ RPE 8'},{name:'Dumbbell incline press',detail:'3×10'}]}]},
    {title:'Deadlift PR Attempt',sections:[{label:'Go for it',items:[{name:'Deadlift',detail:'Build to 1RM — warm up properly, max 2 attempts at top'}]},{label:'Back off',items:[{name:'Deadlift',detail:'3×5 @ RPE 8 of what you hit'},{name:'Barbell row',detail:'4×8'}]}]},
    {title:'Chin-Up Challenge',sections:[{label:'10 sets max reps, 60s rest',items:[{name:'Chinups',detail:'10 sets — max each set, stop 1–2 before failure'}]},{label:'Superset',superset:true,items:[{name:'Barbell row',detail:'4×8'},{name:'Ball slams',detail:'4×10'}]}]},
    {title:'Speed Squat',sections:[{label:'Explosive — jump out of the hole',items:[{name:'Back squat',detail:'8×3 @ RPE 7 — 45s rest'},{name:'Deadlift',detail:'6×2 @ RPE 7 — fast pull, 45s rest'}]},{label:'Power finish',superset:true,items:[{name:'Broad jumps',detail:'4×6'},{name:'Ball slams',detail:'4×10'}]}]},
    {title:'3-Day Compound Test',sections:[{label:'One heavy set each — go heavy',items:[{name:'Barbell bench press',detail:'Heavy 5RM attempt'},{name:'Back squat',detail:'Heavy 5RM attempt'},{name:'Deadlift',detail:'Heavy 3RM attempt'}]}]},
    {title:'Overhead Everything',sections:[{label:'Press volume',items:[{name:'Barbell overhead press',detail:'5×5 @ RPE 8'},{name:'Dumbbell Arnold press',detail:'3×10'},{name:'Kettlebell single-arm press',detail:'3×8 each'}]},{label:'Overhead carry',items:[{name:'Overhead carry',detail:'3×30 yards each arm'},{name:'Barbell push press',detail:'4×6 @ RPE 8'}]}]},
    {title:'Back Builder',sections:[{label:'Pull volume',items:[{name:'Deadlift',detail:'4×5'},{name:'Barbell row',detail:'5×8'},{name:'Chinups',detail:'5×6'}]},{label:'Finisher',superset:true,items:[{name:'Kettlebell single-arm row',detail:'3×15 each'},{name:'Ball slams',detail:'3×12'}]}]},
    {title:'Trap Bar Day',sections:[{label:'Main',items:[{name:'Trap bar deadlift',detail:'5×5 heavy'},{name:'Trap bar farmer carry',detail:'3×50 yards'}]},{label:'Accessory',superset:true,items:[{name:'Kettlebell goblet squat',detail:'4×15'},{name:'Ab wheel rollouts',detail:'3×10'}]}]},
    {title:'Density Block',sections:[{label:'10 min AMRAP A — rest only when needed',superset:true,items:[{name:'Barbell bench press',detail:'5 reps @ RPE 7.5'},{name:'Barbell row',detail:'5 reps'}]},{label:'10 min AMRAP B',superset:true,items:[{name:'Back squat',detail:'5 reps @ RPE 7'},{name:'Kettlebell goblet squat',detail:'10 reps'}]}]},
    {title:'Romanian Deadlift Focus',sections:[{label:'Hinge volume',items:[{name:'Barbell Romanian deadlift',detail:'5×10 @ RPE 7'},{name:'Kettlebell single-leg deadlift',detail:'4×10 each'},{name:'Kettlebell swing',detail:'5×20'}]}]},
    {title:'Paused Bench Focus',sections:[{label:'Bench variations',items:[{name:'Barbell bench press',detail:'5×5 @ RPE 8'},{name:'Paused barbell bench press (2 sec)',detail:'3×5 @ RPE 7.5'},{name:'Close-grip bench press',detail:'3×8'}]}]},
    {title:'Squat + Overhead',sections:[{label:'Superset all day',superset:true,items:[{name:'Back squat',detail:'5×5 @ RPE 8'},{name:'Barbell overhead press',detail:'5×5 @ RPE 8'}]},{label:'Accessory',superset:true,items:[{name:'Kettlebell goblet squat',detail:'3×15'},{name:'Dumbbell lateral raise',detail:'3×15'}]}]},
    {title:'The Long Grind',sections:[{label:'High rep, short rest (45s)',items:[{name:'Barbell bench press',detail:'3×15 @ RPE 7'},{name:'Back squat',detail:'3×15 @ RPE 7'},{name:'Barbell row',detail:'3×15'}]}]},
    {title:'Single Leg Strength',sections:[{label:'Unilateral lower',superset:true,items:[{name:'Dumbbell Bulgarian split squat',detail:'5×10 each'},{name:'Kettlebell single-leg deadlift',detail:'4×10 each'},{name:'Step-ups (KB)',detail:'3×12 each'}]},{label:'Core',items:[{name:'Dead bugs',detail:'3×12 each'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'Strict Press Day',sections:[{label:'No leg drive — strict only',items:[{name:'Barbell overhead press',detail:'5×5 @ RPE 8'},{name:'Barbell push press',detail:'4×5 @ RPE 9'},{name:'Dumbbell Arnold press',detail:'3×10'}]}]},
  ],
  hypertrophy:[
    {title:'Chest Day Maximize',sections:[{label:'Volume A',superset:true,items:[{name:'Barbell bench press',detail:'4×10 @ RPE 7'},{name:'Dumbbell incline press',detail:'4×12'}]},{label:'Volume B',superset:true,items:[{name:'Dumbbell bench press',detail:'3×15'},{name:'Dips',detail:'3×max'}]},{label:'Shoulders',items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Dumbbell front raise',detail:'3×15'}]}]},
    {title:'Back Hypertrophy',sections:[{label:'Pull volume',items:[{name:'Deadlift',detail:'4×8 @ RPE 7.5'},{name:'Barbell row',detail:'5×10'},{name:'Chinups',detail:'5×8'}]},{label:'Isolation',superset:true,items:[{name:'Dumbbell row',detail:'3×15 each'},{name:'Hanging knee raises',detail:'3×15'}]}]},
    {title:'Leg Volume Day',sections:[{label:'Quad focus',items:[{name:'Back squat',detail:'4×10 @ RPE 7'},{name:'Dumbbell Bulgarian split squat',detail:'4×12 each'}]},{label:'Posterior',superset:true,items:[{name:'Barbell Romanian deadlift',detail:'4×12'},{name:'Kettlebell goblet squat',detail:'4×15'}]}]},
    {title:'Shoulder Sculptor',sections:[{label:'Press',items:[{name:'Barbell overhead press',detail:'5×8 @ RPE 7.5'},{name:'Dumbbell Arnold press',detail:'4×12'}]},{label:'Lateral',superset:true,items:[{name:'Dumbbell lateral raise',detail:'5×20'},{name:'Dumbbell front raise',detail:'4×15'}]},{label:'Row',items:[{name:'Barbell row',detail:'4×12'}]}]},
    {title:'Arm Annihilation',sections:[{label:'Triceps',superset:true,items:[{name:'Close-grip bench press',detail:'4×10'},{name:'Dips',detail:'4×max'},{name:'Diamond pushups',detail:'3×15'}]},{label:'Biceps',superset:true,items:[{name:'Chinups',detail:'4×max'},{name:'Dumbbell curl',detail:'4×12'}]}]},
    {title:'Upper Hypertrophy',sections:[{label:'Push A',superset:true,items:[{name:'Barbell bench press',detail:'4×10 @ RPE 7'},{name:'Dumbbell incline press',detail:'4×12'}]},{label:'Pull A',superset:true,items:[{name:'Barbell row',detail:'4×10'},{name:'L-sit chinups',detail:'4×6'}]},{label:'Shoulders',items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Barbell overhead press',detail:'3×10'}]}]},
    {title:'Pump City',sections:[{label:'Chest',superset:true,items:[{name:'Dumbbell bench press',detail:'4×15'},{name:'Pushups (slow tempo)',detail:'3×15'}]},{label:'Back',superset:true,items:[{name:'Barbell row',detail:'4×12'},{name:'Chinups',detail:'4×max'}]},{label:'Arms',superset:true,items:[{name:'Dips',detail:'3×15'},{name:'Dumbbell curl',detail:'3×15'}]}]},
    {title:'Full Body Volume',sections:[{label:'Compounds',items:[{name:'Barbell bench press',detail:'4×8 @ RPE 7.5'},{name:'Back squat',detail:'4×8 @ RPE 7.5'},{name:'Barbell row',detail:'4×8'}]},{label:'Isolation finisher',superset:true,items:[{name:'Dumbbell lateral raise',detail:'3×20'},{name:'Dumbbell curl',detail:'3×15'},{name:'Dips',detail:'3×12'}]}]},
    {title:'Incline & Row',sections:[{label:'Volume',superset:true,items:[{name:'Dumbbell incline press',detail:'5×12'},{name:'Barbell row',detail:'5×12'}]},{label:'Superset B',superset:true,items:[{name:'Barbell overhead press',detail:'4×10'},{name:'Chinups',detail:'4×8'}]},{label:'Finisher',items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Dips',detail:'3×max'}]}]},
    {title:'High Rep Legs',sections:[{label:'45s rest between sets',items:[{name:'Back squat',detail:'4×15 @ RPE 7'},{name:'Kettlebell goblet squat',detail:'4×20'},{name:'Dumbbell Bulgarian split squat',detail:'3×15 each'},{name:'Wall sit',detail:'3×45 sec'}]}]},
    {title:'Chest + Tri Focus',sections:[{label:'Press volume',items:[{name:'Barbell bench press',detail:'5×10 @ RPE 7'},{name:'Dumbbell incline press',detail:'4×12'},{name:'Close-grip bench press',detail:'3×12'}]},{label:'Tri finisher',items:[{name:'Dips',detail:'4×max'},{name:'Diamond pushups',detail:'3×15'}]}]},
    {title:'Back + Bi Focus',sections:[{label:'Pull volume',items:[{name:'Deadlift',detail:'3×8 @ RPE 7.5'},{name:'Barbell row',detail:'4×12'},{name:'Chinups',detail:'5×8'}]},{label:'Bi finisher',items:[{name:'Dumbbell curl',detail:'4×15'},{name:'L-sit chinups',detail:'3×6'}]}]},
    {title:'Single Leg Hypertrophy',sections:[{label:'Unilateral',superset:true,items:[{name:'Dumbbell Bulgarian split squat',detail:'5×10 each'},{name:'Kettlebell single-leg deadlift',detail:'4×10 each'},{name:'Step-ups (KB)',detail:'3×12 each'}]},{label:'Core',items:[{name:'Dead bugs',detail:'3×12 each'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'Density Block',sections:[{label:'10 min AMRAP A',superset:true,items:[{name:'Barbell bench press',detail:'5 reps @ RPE 7.5'},{name:'Barbell row',detail:'5 reps'}]},{label:'10 min AMRAP B',superset:true,items:[{name:'Back squat',detail:'5 reps @ RPE 7'},{name:'Kettlebell goblet squat',detail:'10 reps'}]}]},
    {title:'The Architect',sections:[{label:'Chest',items:[{name:'Barbell bench press',detail:'4×10'},{name:'Dumbbell incline press',detail:'4×12'},{name:'Dips',detail:'3×12'}]},{label:'Back',superset:true,items:[{name:'Chinups',detail:'4×8'},{name:'Barbell row',detail:'4×10'}]},{label:'Shoulders',items:[{name:'Dumbbell lateral raise',detail:'4×20'}]}]},
    {title:'Romanian Deadlift Hypetrophy',sections:[{label:'Hinge focus',items:[{name:'Barbell Romanian deadlift',detail:'5×10 @ RPE 7'},{name:'Kettlebell single-leg deadlift',detail:'3×12 each'},{name:'Kettlebell swing',detail:'4×20'}]}]},
    {title:'Overhead Hypertrophy',sections:[{label:'Press volume',items:[{name:'Barbell overhead press',detail:'5×8 @ RPE 7.5'},{name:'Dumbbell Arnold press',detail:'4×12'},{name:'Kettlebell single-arm press',detail:'3×10 each'}]},{label:'Side delts',items:[{name:'Dumbbell lateral raise',detail:'5×20'},{name:'Dumbbell front raise',detail:'4×15'}]}]},
    {title:'Full Upper Volume',sections:[{label:'Chest + back A',superset:true,items:[{name:'Barbell bench press',detail:'5×10 @ RPE 7'},{name:'Barbell row',detail:'5×10'}]},{label:'Chest + back B',superset:true,items:[{name:'Dumbbell incline press',detail:'4×12'},{name:'Chinups',detail:'4×8'}]},{label:'Shoulders + arms',superset:true,items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Dumbbell curl',detail:'3×15'}]}]},
    {title:'Posterior Chain Hypertrophy',sections:[{label:'All hinge, all volume',items:[{name:'Deadlift',detail:'4×8 @ RPE 7.5'},{name:'Barbell Romanian deadlift',detail:'4×10'},{name:'Kettlebell swing',detail:'5×20'},{name:'Kettlebell single-leg deadlift',detail:'3×10 each'}]}]},
    {title:'Press & Squeeze',sections:[{label:'Slow reps — 3 sec down, 1 up, squeeze at top',items:[{name:'Barbell bench press',detail:'4×10 @ RPE 7 slow'},{name:'Dumbbell incline press',detail:'4×12 slow'},{name:'Dumbbell bench press',detail:'3×15 slow'}]},{label:'Rear + shoulder',items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Barbell row',detail:'3×12'}]}]},
    {title:'Quad Focus',sections:[{label:'Front-loaded for max quad stimulus',items:[{name:'Front squat',detail:'4×8 @ RPE 7'},{name:'Dumbbell Bulgarian split squat',detail:'4×10 each'},{name:'Slow goblet squat (KB)',detail:'4×15 — 3 sec down'}]}]},
    {title:'Lunge Day',sections:[{label:'All unilateral lower',items:[{name:'Reverse lunge (KB)',detail:'4×12 each'},{name:'Walking lunge (KB)',detail:'3×10 each'},{name:'Step-ups (KB)',detail:'3×12 each'}]},{label:'Core',items:[{name:'Dead bugs',detail:'3×12 each'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'Heavy Moderate Superset',sections:[{label:'Alternate heavy and volume',superset:true,items:[{name:'Barbell bench press',detail:'5 heavy, then 10 @ RPE 7'},{name:'Barbell row',detail:'5 heavy, then 10'}]},{label:'Superset B',superset:true,items:[{name:'Back squat',detail:'5 heavy, then 10 @ RPE 7'},{name:'Barbell Romanian deadlift',detail:'10 reps'}]}]},
    {title:'Bicep + Back Blast',sections:[{label:'Pull strength',items:[{name:'Deadlift',detail:'3×5 heavy'},{name:'Weighted chinups',detail:'4×5'}]},{label:'Hypertrophy',superset:true,items:[{name:'Barbell row',detail:'4×10'},{name:'Dumbbell curl',detail:'4×12'}]},{label:'Finisher',items:[{name:'L-sit chinups',detail:'3×6'},{name:'Hanging knee raises',detail:'3×15'}]}]},
    {title:'Death By Chinups',sections:[{label:'Chinup ladder',items:[{name:'Chinups',detail:'1,2,3,4,5,4,3,2,1 — 60s rest between rungs'}]},{label:'Accessory',superset:true,items:[{name:'Barbell row',detail:'4×8'},{name:'Ball slams',detail:'4×10'}]},{label:'Core',items:[{name:'Hanging knee raises',detail:'4×15'},{name:'Ab wheel rollouts',detail:'3×10'}]}]},
    {title:'Weighted Bodyweight',sections:[{label:'Add weight where possible',items:[{name:'Weighted chinups',detail:'5×5'},{name:'Weighted dips',detail:'5×8'},{name:'Barbell row',detail:'4×8'}]},{label:'Volume finisher',items:[{name:'Chinups',detail:'3×max bodyweight'},{name:'Diamond pushups',detail:'3×max'}]}]},
    {title:'Beach Ready Upper',sections:[{label:'Chest',superset:true,items:[{name:'Barbell bench press',detail:'4×10'},{name:'Dumbbell incline press',detail:'4×12'}]},{label:'Arms',superset:true,items:[{name:'Dips',detail:'3×12'},{name:'Dumbbell curl',detail:'3×12'}]},{label:'Shoulders',items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Barbell overhead press',detail:'3×10'}]}]},
    {title:'Hinge + Hamstring Focus',sections:[{label:'Posterior chain volume',items:[{name:'Barbell Romanian deadlift',detail:'4×12'},{name:'Kettlebell single-leg deadlift',detail:'3×10 each'},{name:'Kettlebell swing',detail:'4×20'},{name:'Barbell good mornings',detail:'3×12 @ light'}]}]},
    {title:'Volume Chest + Shoulders',sections:[{label:'All pressing',items:[{name:'Barbell bench press',detail:'4×12 @ RPE 7'},{name:'Dumbbell incline press',detail:'4×15'},{name:'Barbell overhead press',detail:'3×12'},{name:'Dumbbell Arnold press',detail:'3×12'}]},{label:'Side delt finisher',items:[{name:'Dumbbell lateral raise',detail:'5×20'}]}]},
    {title:'Core Hypertrophy',sections:[{label:'Core as a muscle — train it heavy',items:[{name:'Ab wheel rollouts',detail:'4×12'},{name:'Hanging knee raises',detail:'4×15'},{name:'L-sit hold',detail:'4×20 sec'},{name:'Dead bugs',detail:'3×12 each'},{name:'Plank hold',detail:'3×45 sec'}]}]},
  ],
  fatloss:[
    {title:'Cardio Shred',sections:[{label:'Superset A — 4 rounds',superset:true,items:[{name:'Ball slams',detail:'12 reps'},{name:'Burpees',detail:'8 reps'}]},{label:'Superset B — 3 rounds',superset:true,items:[{name:'Jump squats',detail:'15 reps'},{name:'Mountain climbers',detail:'20 reps'}]},{label:'Core',items:[{name:'Ab wheel rollouts',detail:'3×10'},{name:'Dead bugs',detail:'3×12 each'}]}]},
    {title:'The Hurricane',sections:[{label:'Round 1 — 3 sets',superset:true,items:[{name:'Ball slams',detail:'15 reps'},{name:'Burpees',detail:'10 reps'},{name:'Mountain climbers',detail:'20 reps'}]},{label:'Round 2 — 3 sets',superset:true,items:[{name:'Kettlebell swing',detail:'20 reps'},{name:'Broad jumps',detail:'8 reps'},{name:'Plank hold',detail:'30 sec'}]}]},
    {title:'AMRAP 20 Min',sections:[{label:'As many rounds as possible',superset:true,rounds:null,items:[{name:'Kettlebell swing',detail:'15 reps'},{name:'Pushups',detail:'10 reps'},{name:'Chinups',detail:'5 reps'},{name:'Ball slams',detail:'8 reps'}]}]},
    {title:'Sweat Factory',sections:[{label:'5 rounds, 60s rest',superset:true,items:[{name:'Back squat',detail:'10 reps @ RPE 7'},{name:'Barbell row',detail:'10 reps'},{name:'Kettlebell swing',detail:'15 reps'},{name:'Mountain climbers',detail:'20 reps'}]}]},
    {title:'Fight Gone Bad',sections:[{label:'5 stations 1 min each, 3 rounds, 60s rest',superset:true,items:[{name:'Kettlebell swing',detail:'1 min max reps'},{name:'Chinups',detail:'1 min max reps'},{name:'Ball slams',detail:'1 min max reps'},{name:'Pushups',detail:'1 min max reps'},{name:'Jump squats',detail:'1 min max reps'}]}]},
    {title:'Gut Check',sections:[{label:'EMOM 20 min',superset:true,rounds:null,items:[{name:'Odd min: Kettlebell swings',detail:'15 reps'},{name:'Even min: Pushups',detail:'15 reps'}]},{label:'Finisher — 3 rounds',superset:true,items:[{name:'Ball slams',detail:'12 reps'},{name:'Burpees',detail:'8 reps'}]}]},
    {title:'Kettlebell Hell',sections:[{label:'Circuit 4 rounds',superset:true,items:[{name:'Kettlebell swing',detail:'20 reps'},{name:'Kettlebell goblet squat',detail:'15 reps'},{name:'Kettlebell single-arm press',detail:'10 each'},{name:'Ball slams',detail:'10 reps'}]},{label:'Finisher',items:[{name:'Farmer carry',detail:'3×40 yards'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'1000 Rep Challenge',sections:[{label:'Hit 1000 total reps any order any time',items:[{name:'Pushups',detail:'aim 300'},{name:'Kettlebell swing',detail:'aim 300'},{name:'Chinups',detail:'aim 100'},{name:'Dead bugs or situps',detail:'aim 200'},{name:'Broad jumps',detail:'aim 100'}]}]},
    {title:'Barbell Circuit',sections:[{label:'5 rounds 90s rest — same weight',superset:true,items:[{name:'Deadlift',detail:'8 reps'},{name:'Barbell row',detail:'8 reps'},{name:'Barbell bench press',detail:'8 reps'},{name:'Barbell overhead press',detail:'8 reps'},{name:'Back squat',detail:'8 reps'}]}]},
    {title:'Upper Shred',sections:[{label:'4 rounds',superset:true,items:[{name:'Barbell bench press',detail:'10 reps @ RPE 7'},{name:'Barbell row',detail:'10 reps'},{name:'Ball slams',detail:'10 reps'},{name:'Chinups',detail:'max reps'}]},{label:'Shoulder',items:[{name:'Dumbbell lateral raise',detail:'4×20'},{name:'Barbell push press',detail:'3×10'}]}]},
    {title:'Lower Shred',sections:[{label:'4 rounds 60s rest',superset:true,items:[{name:'Back squat',detail:'12 reps @ RPE 7'},{name:'Kettlebell swing',detail:'20 reps'},{name:'Jump squats',detail:'10 reps'},{name:'Mountain climbers',detail:'20 reps'}]}]},
    {title:'Bodyweight Shred',sections:[{label:'5 rounds 60s rest',superset:true,items:[{name:'Chinups',detail:'max reps'},{name:'Diamond pushups',detail:'15 reps'},{name:'Dips',detail:'12 reps'},{name:'Hanging knee raises',detail:'15 reps'},{name:'Broad jumps',detail:'8 reps'}]}]},
    {title:'Zone 2 + Strength',cardio:{type:'run',detail:'25 min easy Zone 2 run (HR 120–135)'},sections:[{label:'Heavy compound',items:[{name:'Deadlift',detail:'4×4 @ RPE 8'},{name:'Barbell row',detail:'4×8'}]},{label:'Conditioning',superset:true,items:[{name:'Kettlebell swing',detail:'3×20'},{name:'Ball slams',detail:'3×12'}]}]},
    {title:'The Afterburner',sections:[{label:'Strength first',items:[{name:'Barbell bench press',detail:'4×4 @ RPE 9'},{name:'Back squat',detail:'4×4 @ RPE 9'}]},{label:'Conditioning — 3 rounds',superset:true,items:[{name:'Kettlebell swing',detail:'20 reps'},{name:'Ball slams',detail:'15 reps'},{name:'Burpees',detail:'10 reps'}]}]},
    {title:'Tabata Hell',sections:[{label:'8 rounds each: 20s work / 10s rest',superset:true,items:[{name:'Round 1: Kettlebell swings',detail:'20s on / 10s off × 8'},{name:'Round 2: Pushups',detail:'20s on / 10s off × 8'},{name:'Round 3: Jump squats',detail:'20s on / 10s off × 8'},{name:'Round 4: Mountain climbers',detail:'20s on / 10s off × 8'}]}]},
    {title:'Carry + Slam Circuit',sections:[{label:'5 rounds',superset:true,items:[{name:'Farmer carry',detail:'40 yards'},{name:'Ball slams',detail:'12 reps'},{name:'Kettlebell swing',detail:'15 reps'},{name:'Burpees',detail:'5 reps'}]}]},
    {title:'Full Body Conditioning',sections:[{label:'4 rounds 90s rest',superset:true,items:[{name:'Deadlift',detail:'8 reps @ RPE 7.5'},{name:'Barbell bench press',detail:'8 reps @ RPE 7.5'},{name:'Chinups',detail:'max reps'},{name:'Ball slams',detail:'10 reps'},{name:'Kettlebell swing',detail:'15 reps'}]}]},
    {title:'Push Pull Shred',sections:[{label:'Push circuit — 3 rounds',superset:true,items:[{name:'Barbell bench press',detail:'10 reps @ RPE 7'},{name:'Diamond pushups',detail:'15 reps'},{name:'Broad jumps',detail:'8 reps'}]},{label:'Pull circuit — 3 rounds',superset:true,items:[{name:'Barbell row',detail:'10 reps'},{name:'Chinups',detail:'max reps'},{name:'Ball slams',detail:'10 reps'}]}]},
    {title:'Hangover Cure',sections:[{label:'Light and easy — just show up',items:[{name:'Barbell bench press',detail:'3×8 @ RPE 7'},{name:'Back squat',detail:'3×8 @ RPE 7'},{name:'Kettlebell swing',detail:'3×15'}]}],note:'Sometimes showing up is the workout.'},
    {title:'Interval Strength',sections:[{label:'Every 2 min: 5 reps bench + 5 reps squat + 10 swings',superset:true,rounds:null,items:[{name:'Barbell bench press',detail:'5 reps @ RPE 8'},{name:'Back squat',detail:'5 reps @ RPE 8'},{name:'Kettlebell swing',detail:'10 reps'}]},{label:'Do 10 rounds. Rest is whatever is left of the 2 min.',items:[]}]},
    {title:'Leg + Cardio Mashup',sections:[{label:'Legs first, then condition',items:[{name:'Back squat',detail:'4×8 @ RPE 7.5'},{name:'Barbell Romanian deadlift',detail:'3×10'},{name:'Kettlebell swing',detail:'5×20'},{name:'Jump squats',detail:'3×15'}]}]},
    {title:'Dumbbell Only Shred',sections:[{label:'Upper lower superset — 4 rounds',superset:true,items:[{name:'Dumbbell bench press',detail:'12 reps'},{name:'Dumbbell row',detail:'12 each'},{name:'Dumbbell goblet squat',detail:'15 reps'},{name:'Dumbbell Romanian deadlift',detail:'12 reps'}]},{label:'Finisher',items:[{name:'Dumbbell curl',detail:'3×15'},{name:'Dumbbell lateral raise',detail:'3×20'}]}]},
    {title:'EMOM Strength',sections:[{label:'Every min on the min for 20 min',superset:true,rounds:null,items:[{name:'Min 1,4,7,10,13,16,19: Deadlift',detail:'3 heavy reps'},{name:'Min 2,5,8,11,14,17,20: Barbell bench',detail:'5 reps @ RPE 8'},{name:'Min 3,6,9,12,15,18: Kettlebell swings',detail:'15 reps'}]}]},
    {title:'Double Kettlebell Complex',sections:[{label:'5 rounds with two KBs — 90s rest',superset:true,items:[{name:'Double kettlebell swing',detail:'10 reps'},{name:'Kettlebell goblet squat',detail:'10 reps'},{name:'Kettlebell single-arm press',detail:'8 each'},{name:'Kettlebell single-arm row',detail:'8 each'},{name:'Farmer carry',detail:'30 yards'}]}]},
    {title:'The Long Shred',sections:[{label:'30 min AMRAP — pace yourself',superset:true,rounds:null,items:[{name:'Kettlebell swing',detail:'10 reps'},{name:'Pushups',detail:'8 reps'},{name:'Chinups',detail:'4 reps'},{name:'Dumbbell goblet squat',detail:'8 reps'},{name:'Plank hold',detail:'15 sec'}]}]},
    {title:'Oxygen Thief',sections:[{label:'4 rounds — no rest between exercises',superset:true,items:[{name:'Back squat',detail:'15 reps @ RPE 7'},{name:'Barbell row',detail:'15 reps'},{name:'Ball slams',detail:'15 reps'},{name:'Mountain climbers',detail:'20 reps'},{name:'Chinups',detail:'max reps'}]},{label:'90s rest between rounds.',items:[]}]},
    {title:'Staircase Conditioning',sections:[{label:'1 rep → 2 reps → 3 → ... → 10, no rest except at top',items:[{name:'Chinups',detail:'1 rung at a time up to 10'},{name:'Ball slams',detail:'Double the reps each rung: 2,4,6...20'},{name:'Kettlebell swing',detail:'Double: 2,4,6...20'}]}]},
    {title:'Navy Grinder',sections:[{label:'5 rounds, 90s rest',superset:true,items:[{name:'Chinups',detail:'10 reps'},{name:'Pushups',detail:'20 reps'},{name:'Ab wheel rollouts',detail:'10 reps'},{name:'Ball slams',detail:'10 reps'},{name:'Kettlebell swing',detail:'20 reps'}]}]},
  ],
  athletic:[
    {title:'Explosive Power',sections:[{label:'Power — 5 rounds',superset:true,items:[{name:'Broad jumps',detail:'5 reps'},{name:'Ball slams',detail:'8 reps'},{name:'Kettlebell swing',detail:'10 reps'}]},{label:'Strength',items:[{name:'Deadlift',detail:'4×3 @ RPE 9'},{name:'Barbell bench press',detail:'4×3 @ RPE 9'}]}]},
    {title:'Full Body Athletic',sections:[{label:'Power circuit — 4 rounds',superset:true,items:[{name:'Kettlebell swing',detail:'15 reps'},{name:'Ball slams',detail:'10 reps'},{name:'Broad jumps',detail:'8 reps'}]},{label:'Strength',items:[{name:'Barbell bench press',detail:'3×5 heavy'},{name:'Deadlift',detail:'3×3 heavy'}]}]},
    {title:'Sprint + Lift',cardio:{type:'run',detail:'6×100m strides — walk back recovery'},sections:[{label:'Strength',items:[{name:'Back squat',detail:'4×5 @ RPE 9'},{name:'Barbell bench press',detail:'4×5 @ RPE 9'}]},{label:'Explosive',superset:true,items:[{name:'Broad jumps',detail:'4×6'},{name:'Ball slams',detail:'4×10'}]}]},
    {title:'The Gauntlet',sections:[{label:'4 rounds 60s rest',superset:true,items:[{name:'Deadlift',detail:'5 reps @ RPE 8'},{name:'Barbell bench press',detail:'5 reps @ RPE 8'},{name:'Chinups',detail:'5 reps'},{name:'Kettlebell swing',detail:'15 reps'},{name:'Ball slams',detail:'10 reps'}]}]},
    {title:'Kettlebell Complex',sections:[{label:"5 rounds 90s rest — one Kettlebell no putting it down",superset:true,items:[{name:'Kettlebell deadlift',detail:'5 reps'},{name:'Kettlebell single-arm row',detail:'5 each'},{name:'Kettlebell clean',detail:'5 each'},{name:'Kettlebell single-arm press',detail:'5 each'},{name:'Kettlebell front squat',detail:'5 each'}]}]},
    {title:'Strongman Saturday',sections:[{label:'Events',items:[{name:'Farmer carry',detail:'5×40 yards, heaviest bells'},{name:'Overhead carry',detail:'3×30 yards each'},{name:'Suitcase carry',detail:'3×40 yards each'}]},{label:'Conditioning',superset:true,items:[{name:'Kettlebell swing',detail:'4×20'},{name:'Ball slams',detail:'4×12'}]}]},
    {title:'Navy Grinder',sections:[{label:'5 rounds 90s rest',superset:true,items:[{name:'Chinups',detail:'10 reps'},{name:'Pushups',detail:'20 reps'},{name:'Ab wheel rollouts',detail:'10 reps'},{name:'Ball slams',detail:'10 reps'},{name:'Kettlebell swing',detail:'20 reps'}]}]},
    {title:'Speed Squat',sections:[{label:'Explosive — jump out of the hole',items:[{name:'Back squat',detail:'8×3, 45s rest — explosive, sub-max (bar speed)'},{name:'Deadlift',detail:'6×2, 45s rest — explosive, sub-max (bar speed)'}]},{label:'Power finish',superset:true,items:[{name:'Broad jumps',detail:'4×6'},{name:'Ball slams',detail:'4×10'}]}]},
    {title:'Mixed Modal',sections:[{label:'Alternate every 5 min for 30 min',superset:true,rounds:null,items:[{name:'Odd 5 min: Spin bike or run',detail:'Sprint effort'},{name:'Even 5 min: Barbell complex',detail:'DL 5 + Row 5 + Bench 5 + Squat 5 @ RPE 7.5'}]}]},
    {title:'Core + Carry Athletic',sections:[{label:'Carry circuit — 3 rounds',items:[{name:'Farmer carry',detail:'50 yards, heavy'},{name:'Suitcase carry',detail:'30 yards each'},{name:'Overhead carry',detail:'30 yards each'}]},{label:'Core — 4 rounds',superset:true,items:[{name:'Ab wheel rollouts',detail:'10 reps'},{name:'Hanging knee raises',detail:'15 reps'},{name:'Plank hold',detail:'45 sec'}]}]},
    {title:'Unilateral Power',sections:[{label:'Single-leg + single-arm',superset:true,items:[{name:'Kettlebell single-leg deadlift',detail:'4×8 each'},{name:'Kettlebell single-arm press',detail:'4×8 each'},{name:'Step-ups (KB)',detail:'4×10 each'}]},{label:'Power',superset:true,items:[{name:'Broad jumps',detail:'4×5'},{name:'Ball slams',detail:'4×10'}]}]},
    {title:'Bodyweight Beast',sections:[{label:'5 rounds',superset:true,items:[{name:'Chinups',detail:'max reps'},{name:'Diamond pushups',detail:'15 reps'},{name:'Dips',detail:'12 reps'},{name:'Hanging knee raises',detail:'15 reps'}]},{label:'Finisher',items:[{name:'L-sit hold',detail:'3×20 sec'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'Reactive Power',sections:[{label:'No hesitation between reps',superset:true,items:[{name:'Broad jumps',detail:'5×5 — max distance'},{name:'Ball slams',detail:'5×8 — max force'},{name:'Kettlebell swing',detail:'5×10 — snap the hips'}]},{label:'Strength',items:[{name:'Deadlift',detail:'4×3 @ RPE 9'},{name:'Barbell bench press',detail:'4×3 @ RPE 9'}]}]},
    {title:'Chaos Mode',sections:[{label:'Random order each set',superset:true,items:[{name:'Deadlift',detail:'5×5 @ RPE 8'},{name:'Barbell bench press',detail:'5×5 @ RPE 8'},{name:'Chinups',detail:'5×6'},{name:'Ball slams',detail:'5×10'}]}]},
    {title:'Overhead Athlete',sections:[{label:'Press',items:[{name:'Barbell overhead press',detail:'5×5 @ RPE 8'},{name:'Dumbbell Arnold press',detail:'3×10'},{name:'Kettlebell single-arm press',detail:'3×8 each'}]},{label:'Overhead carry',items:[{name:'Overhead carry',detail:'3×30 yards each'},{name:'Barbell push press',detail:'4×6 @ RPE 8'}]}]},
    {title:'Press Pull Jump',sections:[{label:'Triple compound superset — 5 rounds',superset:true,items:[{name:'Barbell bench press',detail:'5 reps @ RPE 8'},{name:'Barbell row',detail:'5 reps'},{name:'Broad jumps',detail:'5 reps max distance'}]}]},
    {title:'Squat + Swing + Sprint',cardio:{type:'run',detail:'4×200m sprint — walk back between'},sections:[{label:'Lower power',items:[{name:'Back squat',detail:'4×5 @ RPE 9'},{name:'Kettlebell swing',detail:'5×20'},{name:'Jump squats',detail:'4×10'}]}]},
    {title:'Grip Strength Day',sections:[{label:'Grip circuit',items:[{name:'Farmer carry',detail:'5×50 yards, heavy'},{name:'Hanging hold',detail:'5×max time'},{name:'Suitcase carry',detail:'3×40 yards each'},{name:'L-sit chinups',detail:'4×5'}]}]},
    {title:'The Closer',sections:[{label:'End of week — leave it all out',items:[{name:'Barbell bench press',detail:'3×5 @ RPE 9'},{name:'Deadlift',detail:'3×3 @ RPE 9'},{name:'Back squat',detail:'3×5 @ RPE 9'}]},{label:'Conditioning',superset:true,items:[{name:'Kettlebell swing',detail:'4×20'},{name:'Ball slams',detail:'4×12'}]}]},
    {title:'Event Training',sections:[{label:'Strongman-style events',items:[{name:'Log press (Kettlebell clean + press)',detail:'4×5 each arm'},{name:'Farmer carry relay',detail:'3×50 yards each hand'},{name:'Kettlebell swing medley',detail:'10/15/20 reps with 30s rest'}]}]},
    {title:'Triple Threat',sections:[{label:'3 rounds — all heavy, 2 min rest',items:[{name:'Deadlift',detail:'5 reps @ RPE 9'},{name:'Barbell bench press',detail:'5 reps @ RPE 9'},{name:'Back squat',detail:'5 reps @ RPE 8'}]},{label:'Explosive finisher',superset:true,items:[{name:'Broad jumps',detail:'3×5'},{name:'Ball slams',detail:'3×10'}]}]},
    {title:'Active Recovery Athletic',cardio:{type:'run',detail:'2 mi very easy jog'},sections:[{label:'Mobility only',items:[{name:"Worlds greatest stretch",detail:'5 each'},{name:'Hip 90/90 stretch',detail:'10 each'},{name:'Deep squat hold',detail:'3×45 sec'}]}]},
    {title:'Loaded Carries Marathon',sections:[{label:'8 rounds of carry complex',superset:true,items:[{name:'Farmer carry',detail:'40 yards'},{name:'Suitcase carry',detail:'20 yards each'},{name:'Overhead carry',detail:'20 yards each'}]}]},
    {title:'Power Endurance',sections:[{label:'AMRAP 25 min — pace yourself',superset:true,rounds:null,items:[{name:'Kettlebell swing',detail:'10 reps'},{name:'Chinups',detail:'5 reps'},{name:'Ball slams',detail:'8 reps'},{name:'Broad jumps',detail:'4 reps'}]}]},
    {title:'Speed + Strength Combo',sections:[{label:'Speed sets (bar moves fast)',items:[{name:'Barbell bench press',detail:'6×3 @ RPE 7 — explosive'},{name:'Back squat',detail:'6×3 @ RPE 7 — explosive'},{name:'Deadlift',detail:'5×2 @ RPE 7 — fast pull'}]},{label:'Power finish',superset:true,items:[{name:'Broad jumps',detail:'4×5'},{name:'Kettlebell swing',detail:'4×10'}]}]},
    {title:'The Finisher',sections:[{label:'For time — as fast as possible',superset:true,rounds:null,items:[{name:'50 Kettlebell swings',detail:'break as needed'},{name:'40 pushups',detail:'break as needed'},{name:'30 chinups',detail:'break as needed'},{name:'20 broad jumps',detail:'as fast as possible'},{name:'10 ball slams',detail:'as hard as possible'}]}]},
    {title:'Weighted Vest Day',cardio:{type:'run',detail:'1.5 mi with weighted vest or rucksack'},sections:[{label:'Bodyweight + load',superset:true,items:[{name:'Pushups',detail:'4×15'},{name:'Chinups',detail:'4×max'},{name:'Dips',detail:'4×12'}]},{label:'Core',items:[{name:'Plank hold',detail:'4×45 sec'},{name:'Hanging knee raises',detail:'4×15'}]}]},
    {title:'Kettlebell Flow',sections:[{label:'4 rounds no rest',superset:true,items:[{name:'Kettlebell clean',detail:'5 each'},{name:'Kettlebell single-arm press',detail:'5 each'},{name:'Kettlebell front squat',detail:'5 each'},{name:'Kettlebell swing',detail:'10 reps'}]},{label:'Core',items:[{name:'Dead bugs',detail:'3×12 each'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'Threshold Run + Lift',cardio:{type:'run',detail:'1 mi easy + 1 mi tempo + 1 mi easy'},sections:[{label:'Strength post-run',items:[{name:'Back squat',detail:'3×8 @ RPE 7.5'},{name:'Barbell row',detail:'3×10'}]}]},
  ],
  balanced:[
    {title:'The Full Send',sections:[{label:'Heavy',items:[{name:'Barbell bench press',detail:'4×4 @ RPE 9'},{name:'Deadlift',detail:'4×3 @ RPE 9'}]},{label:'Conditioning — 3 rounds',superset:true,items:[{name:'Kettlebell swing',detail:'20 reps'},{name:'Ball slams',detail:'15 reps'},{name:'Burpees',detail:'10 reps'}]}]},
    {title:'Barbell + Bodyweight',cardio:{type:'run',detail:'1.5 mi easy'},sections:[{label:'Strength',items:[{name:'Barbell bench press',detail:'5×5 heavy'},{name:'Deadlift',detail:'3×5 heavy'}]},{label:'Bodyweight — 3 rounds',superset:true,items:[{name:'Chinups',detail:'max reps'},{name:'Diamond pushups',detail:'15 reps'},{name:'L-sit hold',detail:'20 sec'}]}]},
    {title:'5x5 Day',sections:[{label:'Big 3 all 5×5 @ RPE 8',items:[{name:'Barbell bench press',detail:'5×5 @ RPE 8'},{name:'Back squat',detail:'5×5 @ RPE 8'},{name:'Deadlift',detail:'5×5 @ RPE 8'}]}]},
    {title:'Press & Pull Party',sections:[{label:'Heavy press',items:[{name:'Barbell bench press',detail:'6×3 @ RPE 9'},{name:'Barbell overhead press',detail:'4×6'}]},{label:'Heavy pull',items:[{name:'Weighted chinups',detail:'5×4'},{name:'Barbell row',detail:'4×6'}]},{label:'Finisher',superset:true,items:[{name:'Dumbbell lateral raise',detail:'4×15'},{name:'Dumbbell curl',detail:'4×12'}]}]},
    {title:'Upper Endurance',cardio:{type:'run',detail:'2 mi easy'},sections:[{label:'High rep 45s rest',items:[{name:'Barbell bench press',detail:'4×15 @ RPE 7'},{name:'Barbell row',detail:'4×15'},{name:'Chinups',detail:'4×max'},{name:'Pushups',detail:'4×max'}]}]},
    {title:'Zone 2 + Lift',cardio:{type:'run',detail:'25 min easy HR 120–135'},sections:[{label:'Strength',items:[{name:'Deadlift',detail:'4×4 @ RPE 8'},{name:'Barbell row',detail:'4×8'}]},{label:'Core',items:[{name:'Ab wheel rollouts',detail:'3×10'},{name:'Dead bugs',detail:'3×12 each'}]}]},
    {title:'Core + Carry Day',cardio:{type:'run',detail:'2 mi easy'},sections:[{label:'Carry — 3 rounds',items:[{name:'Farmer carry',detail:'40 yards'},{name:'Suitcase carry',detail:'20 yards each'},{name:'Overhead carry',detail:'20 yards each'}]},{label:'Core — 3 rounds',superset:true,items:[{name:'Ab wheel rollouts',detail:'10 reps'},{name:'Dead bugs',detail:'12 each'},{name:'Plank hold',detail:'45 sec'}]}]},
    {title:'Active Recovery',cardio:{type:'run',detail:'2 mi very easy HR under 130'},sections:[{label:'Mobility',items:[{name:"Worlds greatest stretch",detail:'5 each'},{name:'Hip 90/90 stretch',detail:'10 each'},{name:'Deep squat hold',detail:'3×45 sec'}]},{label:'Light core',items:[{name:'Dead bugs',detail:'3×12 each'},{name:'Bird dogs',detail:'3×10 each'}]}]},
    {title:'Hangover Cure',sections:[{label:'Light and easy',items:[{name:'Barbell bench press',detail:'3×8 @ RPE 7'},{name:'Back squat',detail:'3×8 @ RPE 7'},{name:'Kettlebell swing',detail:'3×15'}]}],note:'Sometimes showing up is the workout.'},
    {title:'Trap Bar Day',sections:[{label:'Main',items:[{name:'Trap bar deadlift',detail:'5×5 heavy'},{name:'Trap bar farmer carry',detail:'3×50 yards'}]},{label:'Accessory',superset:true,items:[{name:'Kettlebell goblet squat',detail:'4×15'},{name:'Ab wheel rollouts',detail:'3×10'}]}]},
    {title:'Squat + Press',sections:[{label:'Superset all day',superset:true,items:[{name:'Back squat',detail:'5×5 @ RPE 8'},{name:'Barbell overhead press',detail:'5×5 @ RPE 8'}]},{label:'Accessory',superset:true,items:[{name:'Kettlebell goblet squat',detail:'3×15'},{name:'Dumbbell lateral raise',detail:'3×15'}]}]},
    {title:'Push Pull Balanced',sections:[{label:'Push',items:[{name:'Barbell bench press',detail:'4×8'},{name:'Dumbbell incline press',detail:'3×10'},{name:'Dips',detail:'3×12'}]},{label:'Pull',items:[{name:'Barbell row',detail:'4×8'},{name:'Chinups',detail:'4×6'},{name:'Kettlebell single-arm row',detail:'3×12 each'}]}]},
    {title:'Sweat Equity',sections:[{label:'4 rounds',superset:true,items:[{name:'Ball slams',detail:'15 reps'},{name:'Kettlebell goblet squat',detail:'15 reps'},{name:'Chinups',detail:'6 reps'},{name:'Pushups',detail:'15 reps'}]}]},
    {title:'Heavy Lower',sections:[{label:'Strength',items:[{name:'Back squat',detail:'4×4 @ RPE 9'},{name:'Deadlift',detail:'3×3 @ RPE 9'}]},{label:'Accessory',superset:true,items:[{name:'Dumbbell Bulgarian split squat',detail:'3×8 each'},{name:'Kettlebell swing',detail:'3×20'}]}]},
    {title:'The Lumberjack',sections:[{label:'Strength',items:[{name:'Deadlift',detail:'5×3 @ RPE 9'},{name:'Barbell row',detail:'4×6'}]},{label:'Kettlebell circuit — 4 rounds',superset:true,items:[{name:'Kettlebell swing',detail:'20 reps'},{name:'Farmer carry',detail:'40 yards'},{name:'Ball slams',detail:'10 reps'}]}]},
    {title:'Max Effort Upper',sections:[{label:'Max effort',items:[{name:'Barbell bench press',detail:'Work to 1–3RM'},{name:'Barbell overhead press',detail:'3×5 @ RPE 8'}]},{label:'Volume',superset:true,items:[{name:'Dumbbell incline press',detail:'3×12'},{name:'Barbell row',detail:'3×10'}]}]},
    {title:'Max Effort Lower',sections:[{label:'Max effort',items:[{name:'Back squat',detail:'Work to heavy 3RM'},{name:'Deadlift',detail:'Work to heavy 3RM'}]},{label:'Accessory',superset:true,items:[{name:'Kettlebell goblet squat',detail:'3×15'},{name:'Wall sit',detail:'3×30 sec'}]}]},
    {title:'Dumbbell Only Day',sections:[{label:'Upper',superset:true,items:[{name:'Dumbbell bench press',detail:'4×12'},{name:'Dumbbell row',detail:'4×12 each'}]},{label:'Lower',superset:true,items:[{name:'Dumbbell goblet squat',detail:'4×15'},{name:'Dumbbell Romanian deadlift',detail:'4×12'}]},{label:'Finisher',superset:true,items:[{name:'Dumbbell curl',detail:'3×15'},{name:'Dumbbell lateral raise',detail:'3×20'}]}]},
    {title:'3-Day Test',sections:[{label:'Heavy set each',items:[{name:'Barbell bench press',detail:'Heavy 5RM'},{name:'Back squat',detail:'Heavy 5RM'},{name:'Deadlift',detail:'Heavy 3RM'}]}]},
    {title:'Speed Bench Day',sections:[{label:'Bar speed focus',items:[{name:'Barbell bench press',detail:'8×3 @ RPE 7, explosive, 45s rest'},{name:'Barbell row',detail:'4×8'}]},{label:'Accessory',superset:true,items:[{name:'Dips',detail:'3×15'},{name:'L-sit chinups',detail:'3×6'}]}]},
    {title:'Volume Legs',sections:[{label:'High rep short rest',items:[{name:'Back squat',detail:'4×15 @ RPE 7'},{name:'Kettlebell goblet squat',detail:'4×20'},{name:'Dumbbell Bulgarian split squat',detail:'3×12 each'}]}]},
    {title:'Full Body Superset',sections:[{label:'A',superset:true,items:[{name:'Barbell bench press',detail:'4×8'},{name:'Barbell row',detail:'4×8'}]},{label:'B',superset:true,items:[{name:'Back squat',detail:'4×8 @ RPE 7.5'},{name:'Barbell Romanian deadlift',detail:'4×10'}]},{label:'C',superset:true,items:[{name:'Kettlebell swing',detail:'3×20'},{name:'Ball slams',detail:'3×12'}]}]},
    {title:'Incline + Pull Focus',sections:[{label:'Upper',superset:true,items:[{name:'Dumbbell incline press',detail:'5×10'},{name:'Barbell row',detail:'5×10'}]},{label:'Superset B',superset:true,items:[{name:'Barbell overhead press',detail:'4×8'},{name:'Chinups',detail:'4×6'}]},{label:'Finisher',items:[{name:'Dumbbell lateral raise',detail:'3×20'},{name:'Dips',detail:'3×max'}]}]},
    {title:'Carry Day',sections:[{label:'8 rounds carry complex',superset:true,items:[{name:'Farmer carry',detail:'40 yards'},{name:'Suitcase carry',detail:'20 yards each'},{name:'Overhead carry',detail:'20 yards each'}]},{label:'Core finisher',items:[{name:'Ab wheel rollouts',detail:'3×10'},{name:'Plank hold',detail:'3×45 sec'}]}]},
    {title:'Hinge + Swing Day',sections:[{label:'Hinge work',items:[{name:'Deadlift',detail:'4×5'},{name:'Barbell Romanian deadlift',detail:'3×10'},{name:'Kettlebell single-leg deadlift',detail:'3×8 each'}]},{label:'Swing finisher',items:[{name:'Kettlebell swing',detail:'10×10 — 30s rest between sets'}]}]},
    {title:'Posterior Chain Day',sections:[{label:'All posterior',items:[{name:'Deadlift',detail:'4×5 @ RPE 8'},{name:'Barbell Romanian deadlift',detail:'4×10'},{name:'Kettlebell swing',detail:'5×20'},{name:'Barbell good mornings',detail:'3×12 light'}]}]},
    {title:'The Grind',sections:[{label:'30 min AMRAP',superset:true,rounds:null,items:[{name:'Barbell bench press',detail:'5 reps @ RPE 7'},{name:'Barbell row',detail:'5 reps'},{name:'Back squat',detail:'5 reps @ RPE 7'},{name:'Kettlebell swing',detail:'10 reps'}]}]},
    {title:'Arm + Core Day',sections:[{label:'Arms',superset:true,items:[{name:'Chinups',detail:'5×max'},{name:'Dips',detail:'5×max'},{name:'Dumbbell curl',detail:'3×15'},{name:'Close-grip bench press',detail:'3×10'}]},{label:'Core',items:[{name:'Ab wheel rollouts',detail:'4×12'},{name:'Hanging knee raises',detail:'4×15'},{name:'L-sit hold',detail:'3×20 sec'}]}]},
    {title:'Shoulder Day',sections:[{label:'Press volume',items:[{name:'Barbell overhead press',detail:'5×6 @ RPE 8'},{name:'Dumbbell Arnold press',detail:'4×10'},{name:'Barbell push press',detail:'3×8'},{name:'Kettlebell single-arm press',detail:'3×8 each'}]},{label:'Side delt',items:[{name:'Dumbbell lateral raise',detail:'5×20'}]}]},
    {title:'Chaos Workout',sections:[{label:'Pick the next exercise at random — flip a mental coin',superset:true,items:[{name:'Barbell bench OR deadlift',detail:'5×5 @ RPE 8'},{name:'Chinups OR barbell row',detail:'5×6'},{name:'Ball slams OR Kettlebell swings',detail:'5×12'},{name:'Broad jumps OR mountain climbers',detail:'4×10'}]}]},
  ]
};

// RANDOM SCREEN
let randFilter='mine';

function getActivePool(){
  const goal=activeProg?.goal||'balanced';
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ st
  if(randFilter==='mine') return RAND_POOLS[goal]||RAND_POOLS.balanced;
  return Object.values(RAND_POOLS).flat();
}

function openRandom(){
  buildRandFilterBar();reroll();
  // @ts-expect-error TS2531 Object is possibly 'null'.
  document.getElementById('randOverlay').classList.add('open');
  // @ts-expect-error TS2531 Object is possibly 'null'.
  document.getElementById('randOverlay').scrollTop=0;
}

function buildRandFilterBar(){
  // V195 (D64): the parenthetical named a pool that does not exist. getActivePool falls
  // back to RAND_POOLS.balanced for every goal RAND_POOLS has no key for, so the label
  // was describing a draw the athlete was not getting. The pool gap itself is D66.
  // @ts-expect-error TS2531 Object is possibly 'null'.
  document.getElementById('randFilterBar').innerHTML=[
    {id:'mine',label:'My Goal'},
    {id:'all',label:'See All'},
  ].map(f=>`<button class="rand-filter-btn${randFilter===f.id?' active':''}" onclick="setRandFilter('${f.id}')">${f.label}</button>`).join('');
}

function setRandFilter(f: any){randFilter=f;buildRandFilterBar();reroll();}

function reroll(){
  const pool=getActivePool();
  let idx;
  do{idx=Math.floor(Math.random()*pool.length);}while(idx===lastRandIdx&&pool.length>1);
  _setLastRandIdx(idx);_setCurrentRandIdx(idx);
  const w=pool[idx];
  const done=getWildcardDone();
  // @ts-expect-error TS7006 Parameter 'd' implicitly has an 'any' type.
  const alreadyDone=done.some(d=>d.title===w.title);
  const now=new Date();
  const dowToKey={0:'sun',1:'mon',2:'tue',3:'wed',4:'thu',5:'fri',6:'sat'};
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'number' can't be used to index type '{
  _setCurrentRandDayKey(dowToKey[now.getDay()]||'mon');
  const goal=activeProg?.goal||'balanced';
  const colors={strength:'var(--lift)',hypertrophy:'var(--hip)',fatloss:'var(--run)',athletic:'var(--bike)',balanced:'var(--accent)',endurance:'var(--run)',support_strength:'var(--lift)',support_athletic:'var(--bike)',support_prevention:'var(--hip)'};
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ st
  const color=colors[goal];
  let html=`<div style="text-align:center;padding:4px 0 16px">
    <div class="rand-badge" style="background:${color}22;color:${color}">${alreadyDone?'Done Before ✓':'Wildcard'}</div>
    <div class="rand-title">${w.title}</div>
  </div>`;
  if(w.cardio){
    const ctype=(w.cardio.type||'').toLowerCase();
    const blockCls=ctype.includes('swim')?'swim-block':ctype.includes('run')?'run-block':ctype.includes('bike')?'bike-block':'cardio-block';
    const labelCls=ctype.includes('swim')?'cardio-label-swim':ctype.includes('run')?'cardio-label-run':ctype.includes('bike')?'cardio-label-bike':'cardio-label-general';
    html+=`<div class="${blockCls}"><div class="cardio-type-label ${labelCls}">${w.cardio.type}</div><div class="cardio-detail">${w.cardio.detail}</div></div>`;
  }
  // @ts-expect-error TS2554 Expected 2 arguments, but got 1.
  html+=buildSectionsHTML(w.sections);
  if(w.note) html+=`<div class="note-block">${w.note}</div>`;
  if(alreadyDone) html+=`<div class="wildcard-done-block">✓ You've done this one before</div>`;
  else html+=`<button class="wildcard-complete-btn" onclick="completeWildcard('${(w.title||'').replace(/'/g,"\\'")}')">${asyIcon('✅',14)} Complete — Mark Done</button>`;
  // @ts-expect-error TS2531 Object is possibly 'null'.
  document.getElementById('randBody').innerHTML=html;
}

// ── V195 (D64/D71): A WILDCARD IS A SUBSTITUTE, NOT A COMPLETION ─────────────
// Until V194 completeWildcard called markDayComplete, which wrote a `complete` record
// into ia_comp_ and froze the day into ia_hist_. Three consequences, all wrong: a rest
// day was marked trained, a prescribed session the athlete never did was marked done,
// and openDetail renamed that day's header to the Wildcard's title forever. The stamp
// also landed on `currentWeek` (the week being VIEWED) paired with today's weekday, so
// browsing week 11 in week 9 wrote the record two months out.
// The record now lives in ia_wild_ only. ia_comp_ has three readers that treat the mere
// EXISTENCE of a record as "this day was touched" (refreshProgram freezes it,
// restMoveCandidates disqualifies it as a rest-move target, maybeShowReminder suppresses
// the next-day nudge). None of those were ruled, so nothing on this path writes there.
// The day is resolved from the DATE, with the same arithmetic scheduledDays uses. Off
// the calendar of the block, the Wildcard still logs to the counter and refuses to stamp
// any day at all rather than stamping the wrong one.
function wildcardDayFor(now: any){
  if(!activeProg||!activeProg.startDate||!activeProg.weeks) return null;
  const d=new Date(now||new Date()); d.setHours(0,0,0,0);
  const mon=getWeekMonday(activeProg.startDate);
  const diff=Math.round((d.getTime()-mon.getTime())/86400000);   // round: DST-safe day count
  if(diff<0) return null;
  const week=Math.floor(diff/7)+1;
  const tw=activeProg.totalWeeks||Object.keys(activeProg.weeks).length;
  if(week<1||week>tw) return null;
  const dayKey=['mon','tue','wed','thu','fri','sat','sun'][diff%7];
  if(!activeProg.weeks[week]||!activeProg.weeks[week][dayKey]) return null;
  if(dayBeforeStart(activeProg,week,dayKey)) return null;        // V174 (D24): outside the block
  return {week:week,dayKey:dayKey};
}
// ia_wild_ entries are deduped by title by the surface itself (a title already done shows
// the done block, never the Complete button), so one title carries at most one day stamp.
// Pre-V195 entries have no week/dayKey and simply render no mark.
function wildcardDaySet(){
  const m={};
  // @ts-expect-error TS7006 Parameter 'x' implicitly has an 'any' type.
  getWildcardDone().forEach(x=>{ if(x&&x.week&&x.dayKey) m[completedKey(x.week,x.dayKey)]=x; });
  return m;
}
function wildcardOn(week: any,dayKey: any){
  if(!week||!dayKey) return null;
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
  return wildcardDaySet()[completedKey(week,dayKey)]||null;
}
// Flame plus a W, signal orange, inline SVG from the icon table. Never emoji.
function wildcardMarkHTML(size: any){
  size=size||14;
  return '<span class="wc-mark" aria-label="Wildcard done">'+asyIcon('flame',size)+'<span class="wc-mark-w">W</span></span>';
}
// The tag names the prescribed session out loud. That is the guardrail: the athlete has
// to be able to see that the session they were given is still waiting.
function wildcardTagHTML(week: any,dayKey: any){
  const wc=wildcardOn(week,dayKey); if(!wc) return '';
  const day=activeProg&&activeProg.weeks&&activeProg.weeks[week]?activeProg.weeks[week][dayKey]:null;
  const sub=(day&&day.rest)
    ? 'Rest day. The streak sits this one out.'
    : ((day&&day.title)||'Your session')+' is still on the board.';
  return '<div class="wc-tag">'+wildcardMarkHTML(16)
    +'<div class="wc-tag-txt"><div class="wc-tag-lbl">WILDCARD DONE</div>'
    +'<div class="wc-tag-sub">'+esc(sub)+'</div></div></div>';
}
// Its own dispatcher. fireCompletionPopup escalates to the season banner on the final
// scheduled day, and that banner claims the block is finished — a Wildcard may never
// say that, claim a PR, or claim progress.
function fireWildcardPopup(isTraining: any){
  popFire('workout',{
    kicker:'WILDCARD DONE',
    msg:'You showed up. That is the whole game.',
    sub:isTraining?('Streak: '+computeStreak()+'.'):'Streak holds.'
  });
}
function completeWildcard(title: any){
  const done=getWildcardDone();
  const slot=wildcardDayFor(new Date());
  // @ts-expect-error TS7006 Parameter 'd' implicitly has an 'any' type.
  if(!done.some(d=>d.title===title)) done.push({title,ts:Date.now(),week:slot?slot.week:null,dayKey:slot?slot.dayKey:null});
  saveWildcardDone(done);
  const day=(slot&&activeProg&&activeProg.weeks&&activeProg.weeks[slot.week])?activeProg.weeks[slot.week][slot.dayKey]:null;
  const isTraining=!!(day&&!day.rest);
  updateRandCounter();showToast(title+' logged ✓');closeRandom();
  if(activeProg) renderWeekView();
  setTimeout(()=>fireWildcardPopup(isTraining),380);
}
// @ts-expect-error TS2531 Object is possibly 'null'.
function closeRandom(){document.getElementById('randOverlay').classList.remove('open');}

let resetPending=false;
function resetWildcardCounter(){
  if(!resetPending){
    resetPending=true;
    const rb=document.getElementById('resetRandBtn');
    if(rb){rb.textContent='Tap again';rb.style.color='var(--red)';}
    setTimeout(()=>{resetPending=false;updateRandCounter();},3000);return;
  }
  resetPending=false;saveWildcardDone([]);updateRandCounter();showToast('Wildcard counter reset ✓');
}
function updateRandCounter(){
  const done=getWildcardDone();
  const goal=activeProg?.goal||'balanced';
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ st
  const pool=RAND_POOLS[goal]||RAND_POOLS.balanced;
  // @ts-expect-error TS7006 Parameter 'd' implicitly has an 'any' type.
  const myDone=done.filter(d=>pool.some(w=>w.title===d.title)).length;
  const el=document.getElementById('randCounter');if(el) el.textContent=myDone+'/'+pool.length;
  if(!resetPending){const rb=document.getElementById('resetRandBtn');if(rb){rb.textContent='↺ Reset';rb.style.color='';}}
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { RAND_POOLS, updateRandCounter, wildcardMarkHTML, wildcardOn, wildcardTagHTML };
