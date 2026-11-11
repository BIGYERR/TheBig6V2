# Swipe deck: what a card would print (measure, 2026-11-10, v0.259.4)

For D283 P-DECKFIT (`docs/decisions/swipe-deck.md`). Script: `tests/measure/swipe-deck_prescriptions.js`, run on
`index.html` at v0.259.4. Every program on the shared 864-config lattice (HALF_MANNY under each override), every training
day, every section: each distinct prescription string (`item.detail`) and section label with its count.

## Findings

- 250 distinct prescriptions; 190 carry an em or en dash, 106 an em dash. The em dash joins the dose to the RPE or a cue
  ("2 sets — RPE 7 (leave 3 or more in reserve)", "2×45 sec each side — knee straight, then bent"); the en dash writes a
  range ("8–12 each @ RPE 7", "2–3 min rest").
- 157 distinct section labels; 122 carry " — ". Only two of them title a deck card (a round or a block): "Leg circuit —
  runner armor" and "Foot & ankle — mobility only". The other 120 ("Main — …", "Primer — …", "Secondary compound — …",
  "Trunk — …", "Glute — runner armor", "Calf — achilles armor", "Power — explosive first") label a single lift and print
  as its kicker.
- Card shapes on the same build (`tests/measure/swipe-deck_day-shapes.js`, 891 programs, 61,893 training days): no round
  or block holds more than three moves; the five-move cool down (2,964 days) is the tallest card.

## The run

```
METHOD tests/measure/swipe-deck_prescriptions.js on index.html | builds 864 | training days 60480
PRESCRIPTIONS distinct 250 | with an em or en dash 190 | with an em dash 106
22712	2 sets — RPE 7 (leave 3 or more in reserve)
12072	2×30 sec each
11880	
8806	3×12 each
8732	3 sets — RPE 8 (stop 2 reps short of failure)
6943	4 sets — RPE 7 (leave 3 or more in reserve)
5861	2×25 sec
5724	2×15 each
5557	2×8–12 each @ RPE 7
4930	2×6–10 @ RPE 7
4574	2×12–15 @ RPE 7
4564	3×30–45 sec each
4240	2 sets — RPE 8 (stop 2 reps short of failure)
4232	4 sets — RPE 8 (stop 2 reps short of failure)
4025	2 sets — RPE 6 (leave 3 or more in reserve)
3888	2×45 sec each
3879	3×8 each
3838	3×10–15 @ RPE 8
3648	2×20 sec each
3564	2×10 each
2916	2×45 sec each side — knee straight, then bent
2916	2×45 sec each side — hip flexors; squeeze the trailing glute
2916	2×45 sec each side
2916	2×45 sec — thread the needle, reach long
2916	~3 min — calves, quads, glutes; slow passes
2826	2×5 each direction
2793	3×10–12 @ RPE 8
2792	2×12–15 each @ RPE 7
2671	3 sets — RPE 7 (leave 3 or more in reserve)
2568	2 sets — RPE 6 (leave plenty in the tank), 2–3 min rest
2383	3 sets — RPE 7 (leave ~3 in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
2344	3×8–12 @ RPE 8
2339	2×10
2310	2×15
2309	3×8–12 each @ RPE 8
2295	2×12–15 each, slow 3-sec lower
2295	2×8 — hold RPE 7, three in the tank
2190	2×20
2160	2×6 each, slow
2160	2×12 — RPE 6–7, leave 3+ in reserve — 3 min rest, focus on form
2052	3×12–15 @ RPE 8
2007	2×10–15 @ RPE 7
1950	2×5 each direction, each leg
1942	3×25 sec
1830	4×25 sec
1770	2×20 each foot
1755	3×10 — RPE 5–6 (primer — light and crisp, well short of failure), 2–3 min rest
1721	3×20 alternating
1702	2×12–15 each @ RPE 8
1674	3×6–10 @ RPE 8
1658	2×6–10 each @ RPE 7
1641	2 sets — RPE 6 (leave plenty in the tank), ramp up with 2–3 warmup sets, 2–3 min rest
1638	3×10 each
1638	4×10–15 @ RPE 8
1620	4×8–12 @ RPE 8
1620	2 sets — RPE 6 (leave plenty in the tank)
1596	3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest
1570	3×12
1512	2×12 each, slow
1512	2×6 each side, slow
1506	4×8–12 each @ RPE 8
1506	3×8 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
1497	4×6–10 @ RPE 8
1464	3×15–20 @ RPE 8
1452	4×6–10 @ RPE 7
1429	3×6 each, 8 sec holds
1428	4×12–15 @ RPE 8
1368	2×12–15 @ RPE 8
1351	4 sets — RPE 6 (leave 3 or more in reserve)
1350	3×12 each, 3 sec lower
1344	3 sets — RPE 6 (leave 3 or more in reserve)
1336	4×10
1331	3 sets — RPE 7 (leave ~3 in reserve), ramp up with 2–3 warmup sets, 3 min rest
1310	2×15–20 each @ RPE 7
1296	3×16 (180° arc)
1296	2×12
1290	3×12 each, light
1250	4×12–15 @ RPE 7
1248	3×12 — RPE 6–7, leave 3+ in reserve
1248	4×12 — RPE 6–7, leave 3+ in reserve
1230	3×20 sec each
1200	2×30 sec
1200	2×8 each
1188	2×6 each
1163	2×10 each — hold RPE 7, three in the tank
1152	5 each side
1150	2×15–20 each @ RPE 8
1116	2×5–6 @ RPE 7
1111	3×10
1107	5×10 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest
1068	3×8 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
1014	2×30 yards
1005	3×40 yards each, heavy
1004	2×8–12 each @ RPE 8
972	4×10–12 @ RPE 8
969	3×12 — RPE 5–6 (primer — light and crisp, well short of failure), 2–3 min rest
956	2×8 each — hold RPE 7, three in the tank
936	3×8
921	2 sets — RPE 6 (leave plenty in the tank), ramp up with 2–3 warmup sets, 3 min rest
900	3×20 sec max tension
872	2×8
864	2×8–12 @ RPE 7
839	3×30 sec each
832	3×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
828	5×10 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 3 min rest
810	4×15
787	2×8–12 each @ RPE 6–7
760	4×10–15 @ RPE 7
756	2×6–10 @ RPE 8
753	3×13 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest
744	2×12–15 @ RPE 6–7
744	2×12 — RPE 5–6 (primer — light and crisp, well short of failure), 2–3 min rest
738	3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
732	2×15–20 @ RPE 7
720	3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
696	3×5–6 @ RPE 8
696	4×5–6 @ RPE 8
675	4×8 — hold RPE 7, three in the tank
675	3×8 — hold RPE 7, three in the tank
648	3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 3 min rest
642	4×8–12 each @ RPE 7
635	3×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
630	2×10 each foot
608	2×6–10 @ RPE 6–7
600	3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 3 min rest
588	2×20 each
558	4×5–6 @ RPE 7
552	3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
547	3×40 yards, heavy
543	3×13 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 3 min rest
542	3×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
540	2×15–20 @ RPE 8
540	3×8 each, slow
507	3×40 yd
504	2×10–15 each @ RPE 7
495	3×30 sec
486	3×10 — RPE 7.5 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
486	4×10 — RPE 8 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
486	5×10 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
480	2×10–15 @ RPE 8
464	2×5–6 @ RPE 8
448	3×10–15 @ RPE 6–7
429	3×40 yd each
426	3×15
415	5×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
406	3×10–12 @ RPE 6–7
396	3×10 — RPE 7.5 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
396	4×10 — RPE 8 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
396	5×10 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
387	2×8 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
387	2×9 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest
378	4×12
360	3 sets — RPE 7 (leave ~3 in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
360	2×15–20 @ RPE 6–7
360	3×10–15 each @ RPE 8
360	4×10–15 each @ RPE 8
360	4×8 each — hold RPE 7, three in the tank
351	4×8–12 @ RPE 7
344	3×10–12 @ RPE 7
340	3×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
336	4×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
332	3×10 each — hold RPE 7, three in the tank
332	4×10 each — hold RPE 7, three in the tank
330	2×8–12 @ RPE 8
316	2×12–15 each @ RPE 6–7
300	5×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
300	2×5–6 — hold RPE 7, three in the tank
291	3×40 sec
288	3×12–15 each @ RPE 8
288	4×12–15 each @ RPE 8
276	2×8 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
276	2×9 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 3 min rest
275	3×10–15 @ RPE 7
260	3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 2–3 min rest
258	3×8–12 @ RPE 7
252	2 sets — RPE 6 (leave plenty in the tank), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
252	3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
244	3×8 each — hold RPE 7, three in the tank
240	2×10–15 @ RPE 6–7
240	2×10–15 each @ RPE 8
240	3×8 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
232	2×5–6 @ RPE 6–7
225	4×10 — fast and crisp, 60s rest
225	3×20 marches
216	2×8–12 @ RPE 6–7
210	3×15–20 @ RPE 6–7
210	4×5–6 — hold RPE 7, three in the tank
208	3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 3 min rest
208	4×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
206	4×10 — RPE 7.5 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
206	5×10 — RPE 8 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
204	4×6–10 each @ RPE 7
202	2×6–10 each @ RPE 6–7
198	3×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
198	5×10 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
195	4×10–15 each @ RPE 7
192	4×10–12 @ RPE 7
189	4×12–15 each @ RPE 7
188	2×10 — hold RPE 7, three in the tank
180	3×8–12 @ RPE 6–7
173	3×20
168	3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
162	3×10–12 each @ RPE 8
162	4×10–12 each @ RPE 8
144	2×10–12 each @ RPE 7
144	3×10–12 each @ RPE 7
144	4×10–12 each @ RPE 7
132	3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
132	3×13 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
132	3×10 — RPE 7.5 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
132	4×10 — RPE 8 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
132	5×10 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
132	4×10 — RPE 7.5 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
132	5×10 — RPE 8 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
132	2×10–12 @ RPE 7
126	3×12 — hold RPE 7, three in the tank
120	2×10–15 each @ RPE 6–7
120	3×6–10 each @ RPE 8
120	3×5–6 — hold RPE 7, three in the tank
112	5×10 — fast and crisp, 60s rest
105	3×15–20 @ RPE 7
96	2×10–12 each @ RPE 8
95	4×10 — hold RPE 7, three in the tank
93	3×8–12 each @ RPE 6–7
92	4×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
79	4×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
72	2×10 — fast and crisp, 60s rest
66	2×8 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
66	2×9 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
66	4×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
66	5×10 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest — 3 min rest, focus on form
66	2×10–12 each @ RPE 6–7
60	4×8
54	2×10–12 @ RPE 6–7
48	4×8 each
48	2×10–12 @ RPE 8
38	3×10 — hold RPE 7, three in the tank
36	3×10 — fast and crisp, 60s rest
30	3×10–15 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest
30	3×6–10 each @ RPE 6–7
24	2×12 each
24	4×15 each
24	4×12 each
24	3×8–12 each @ RPE 7
4	3×5 — explosive, ~2 min rest
3	5×3 — max intent, ~2 min rest
2	3×3 — max intent, ~2 min rest
2	3×5 — light bar, explosive, ~2 min rest
1	4×3 — max intent, ~2 min rest
1	3×5 — explosive, ~3 min rest
LABELS distinct 157 | with " — " 122
13806	(none)
10368	Hip stability
9828	Foot & ankle
7992	Taper
7776	Pump
7739	Pull superset A
6480	Strength
5184	Leg circuit — runner armor
4356	Leg superset B
3935	Pull
3888	Accessory
3888	Main — Dumbbell goblet squat
3888	Rehab focus
3888	Trunk — anti-rotation
3402	Leg superset A
3168	Main — Dumbbell bench press
3028	Biceps
3025	Trunk — anti-extension
2939	Delt finisher
2916	Post-run mobility
2835	Row volume
2754	Calf — achilles armor
2754	Chest volume
2753	Delts
2592	Shoulder mobility
2592	Forearm mobility
2505	Explosive finisher
2256	Glute — runner armor
2232	Main — Dumbbell incline press
2164	Pull superset B
2022	Cuff and scapula
1944	Elbow and forearm
1836	Main — Barbell Romanian deadlift
1776	Main — Squat (slow 3s tempo)
1728	Secondary compound — Dumbbell incline press
1664	Chest + knee
1552	Loaded carry finisher
1464	Main — Decline pushups
1458	Main — Back squat
1296	Main — Sumo deadlift
1224	Main — Dumbbell Romanian deadlift
1221	Calves
1188	Main — Incline barbell press
1134	Lower strength
1080	Main — Close-grip bench press
1008	Main — Kettlebell single-leg deadlift
1008	Main — Pushup variation (weighted)
960	Main — Single-leg glute bridge
882	Upper superset
864	Secondary compound — Dumbbell bench press
832	Leg isolation
756	Foot & ankle — mobility only
748	Main — Pushups (slow 3s eccentric)
720	Main — Pike pushups
720	Main — Dumbbell decline press
720	Main — Machine chest press
648	Secondary compound — Close-grip bench press
648	Leg
636	Primer — Dumbbell goblet squat
600	Main — Feet-elevated inverted row (under a table)
567	Primer — Diamond pushups
564	Main — Inverted row (under a table)
540	Main — Trap bar deadlift
532	Main — Incline pushups (hands on bed)
486	Main — Front squat
486	Primer — Dumbbell bench press
468	Main — Single-leg squat (assisted)
450	Power — explosive first
450	Main — Single-leg hip thrust
444	Main — Diamond pushups
444	Main — Chinups
432	Main — Decline pushups (feet elevated)
424	Main — Wide-stance pushups
384	Main — Pushups (slow tempo)
360	Primer — Decline pushups
360	Delts finisher
324	Primer — Pushup variation (weighted)
324	Primer — Sumo deadlift
324	Primer — Incline barbell press
318	Main — Neutral-grip chinups
312	Main — Banded hip thrust
300	Primer — Squat (slow 3s tempo)
300	Main — Kettlebell swing
276	Main — Bulgarian split squat (foot on chair)
276	Primer — Pike pushups
270	Primer — Inverted rows (bodyweight)
270	Main — 45° back extension
258	Main — Assisted pullups
252	Main — Bodyweight back extension
240	Main — Split squat
234	Primer — Back squat
216	Secondary compound — Decline pushups (feet elevated)
216	Primer — Kettlebell single-leg deadlift
216	Primer — Dumbbell incline press
216	Main — Deadlift
216	Primer — Barbell Romanian deadlift
180	Main — Step-ups (KB)
180	Arms finisher
165	Primer — Pike pushups (feet elevated)
162	Primer — Close-grip bench press
162	Primer — Single-leg glute bridge
150	Primer — Inverted row (under a table)
144	Secondary compound — Incline pushups (hands on bed)
144	Secondary compound — Pushups (slow 3s eccentric)
144	Primer — Dumbbell Romanian deadlift
144	Upper
144	Primer — Pushups (slow tempo)
144	Main — Lat pulldown
135	Primer — Dumbbell row
135	Primer — Dips
132	Main — Inverted row (knees bent, under a table)
132	Main — Archer pushups
132	Main — Single-leg hip thrust (shoulders on bed)
132	Main — Barbell hip thrust
132	Main — Weighted chinups
108	Primer — Decline pushups (feet elevated)
108	Primer — Step-ups (KB)
108	Primer — Dumbbell decline press
108	Main — Barbell bench press
108	Primer — Trap bar deadlift
108	Main — Leg press
105	Primer — Pushups (slow 3s eccentric)
96	Primer — Feet-elevated inverted row (under a table)
90	Primer — Front squat
84	Main — Assisted pistol squat
84	Main — Cable pull-through
81	Primer — Barbell row
78	Primer — Chinups
72	Secondary compound — Diamond pushups
72	Secondary compound — Archer pushups
72	Main — Kettlebell goblet squat
72	Primer — Single-leg hip thrust
63	Primer — Lat pulldown
60	Primer — Kettlebell swing
60	Primer — Banded hip thrust
54	Primer — Kettlebell single-arm row
48	Main — Close-grip pushups
48	Primer — Assisted pullups
48	Primer — 45° back extension
42	Primer — Bulgarian split squat (foot on chair)
42	Primer — Split squat
42	Primer — Neutral-grip chinups
36	Primer — Incline pushups (hands on bed)
36	Main — Heel-elevated goblet squat
36	Primer — Single-leg squat (assisted)
36	Primer — Bodyweight back extension
30	Primer — Wall walks
27	Primer — Straight-arm pulldown
24	Primer — Inverted row (knees bent, under a table)
24	Primer — Single-leg hip thrust (shoulders on bed)
18	Primer — Archer pushups
18	Primer — Barbell hip thrust
12	Primer — Assisted pistol squat
12	Primer — Leg press
12	Primer — Cable pull-through
12	Primer — Weighted chinups
4	Triceps
```
