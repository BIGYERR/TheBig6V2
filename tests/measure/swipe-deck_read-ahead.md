# Swipe deck: the read-ahead measure (2026-11-08, v0.256.0)

Output of `tests/measure/swipe-deck_read-ahead.js` on `index.html` at v0.256.0, for coach's read-ahead ruling (D275,
`docs/decisions/swipe-deck.md`). Hinge and lower body name rules and the card rule are those of
`tests/measure/swipe-deck_day-shapes.js`; "load" is a name class (barbell, dumbbell or kettlebell, band or cable, other).

```
METHOD tests/measure/swipe-deck_read-ahead.js on index.html | HALF_MANNY digest 147f083be4e04e34

== SET lattice | hinge movements 15134
card 4 or later: 18 | no lower body card before 0 | load {"band/cable":18}
   9 after lower | lattice lowback/workaround commercial hypertrophy beginner | Legs | card 4 lift Cable pull-through | run none | before: lift:Dumbbell goblet squat | round:Dumbbell Bulgarian split squat/Spanish squat hold (KB) | lift:Barbell hip thrust
   9 after lower | lattice lowback/workaround commercial hypertrophy intermediate | Legs | card 4 lift Cable pull-through | run none | before: lift:Dumbbell goblet squat | round:Dumbbell Bulgarian split squat/Spanish squat hold (KB) | lift:Barbell hip thrust
not Main, no lower body before: 2253 | by card {"1":1661,"2":520,"3":72} | load {"db/kb":1353,"barbell":654,"other":189,"band/cable":57} | by kind {"lift":1433,"round":820}
   324 Sumo deadlift (barbell) card 1 lift
   251 Kettlebell swing (db/kb) card 1 lift
   234 Kettlebell single-leg deadlift (db/kb) card 1 round
   216 Kettlebell single-leg deadlift (db/kb) card 1 lift
   216 Barbell Romanian deadlift (barbell) card 1 lift
   164 Kettlebell swing (db/kb) card 2 round
   144 Dumbbell Romanian deadlift (db/kb) card 1 lift
   129 Zercher single-leg deadlift (other) card 1 round
   126 Kettlebell swing (db/kb) card 2 lift
   108 Trap bar deadlift (barbell) card 1 lift
  runs on those days: {"Easy Run (protected)":774,"Speed Run":450,"none":426,"Incline Walk":342,"Recovery Run":202,"Long Run":59}

== SET other | hinge movements 576
card 4 or later: 31 | no lower body card before 10 | load {"db/kb":19,"barbell":8,"other":4}
   2 NO LOWER BEFORE | 1.5 mi test, fat loss | Push (light) | card 4 round Dumbbell Romanian deadlift | run Long Slow Distance (LSD) | before: lift:Pushups (slow tempo) | lift:Dumbbell Arnold press | round:Diamond pushups/Bench dips
   2 NO LOWER BEFORE | 1.5 mi test, fat loss | Push (light) | card 4 round Double Kettlebell deadlift | run Long Slow Distance (LSD) | before: lift:Pushups (slow tempo) | lift:Seated dumbbell shoulder press | round:Dumbbell incline press/Overhead dumbbell extension
   2 after lower | bike ftp | Legs | card 4 lift Zercher single-leg deadlift | run Sweet Spot (CHI) | before: lift:Front squat | lift:Deficit reverse lunge (KB) | lift:Spanish squat hold (KB)
   2 after lower | bike ftp | Legs | card 4 lift Barbell good mornings | run Sweet Spot (CHI) | before: lift:Paused back squat | lift:Landmine reverse lunge | lift:Spanish squat hold (KB)
   2 after lower | bike ftp | Legs | card 4 lift Kettlebell single-leg deadlift | run Sweet Spot (CHI) | before: lift:Back squat | lift:Goblet side lunge to knee drive | lift:Wall sit
   2 after lower | bike ftp | Legs | card 4 lift Barbell good mornings | run Sweet Spot (CHI) | before: lift:Paused back squat | lift:Step-ups (KB) | lift:Terminal knee extension (band)
   2 after lower | bike ftp | Legs | card 4 lift Dumbbell split-stance deadlift | run Sweet Spot (CHI) | before: lift:Barbell box squat | lift:Barbell reverse lunge | lift:Terminal knee extension (band)
   2 after lower | bike ftp | Legs | card 4 lift Barbell good mornings | run Sweet Spot (CHI) | before: lift:Barbell box squat | lift:Step-downs (KB) | lift:Wall sit
   2 after lower | bike ftp | Legs | card 4 lift Barbell Romanian deadlift | run Sweet Spot (CHI) | before: lift:Front squat | lift:Dumbbell Bulgarian split squat | lift:Spanish squat hold (KB)
   2 after lower | bike ftp | Legs | card 4 lift Kettlebell swing | run Sweet Spot (CHI) | before: lift:Barbell box squat | lift:Dumbbell goblet side lunge | lift:Wall sit
   2 after lower | bike ftp | Legs | card 4 lift Zercher single-leg deadlift | run Sweet Spot (CHI) | before: lift:Barbell pin squat | lift:Step-downs (KB) | lift:Spanish squat hold (KB)
   1 NO LOWER BEFORE | marathon | Push (light) | card 4 lift Kettlebell swing | run Recovery Run | before: lift:Dumbbell bench press | lift:Landmine rotational press | round:Diamond pushups/Bench dips
   1 NO LOWER BEFORE | marathon | Push (light) | card 4 lift Kettlebell swing | run Recovery Run | before: lift:Dumbbell incline press | lift:Landmine rotational press | round:Dumbbell floor press/Bench dips
   1 NO LOWER BEFORE | 1.5 mi test, fat loss | Push (light) | card 4 round Kettlebell swing | run Long Slow Distance (LSD) | before: lift:Pike pushups | lift:Dumbbell lateral raise | round:Diamond pushups/Bench dips
not Main, no lower body before: 105 | by card {"1":76,"2":15,"3":4,"4":10} | load {"db/kb":78,"barbell":22,"other":5} | by kind {"round":80,"lift":25}
   20 Kettlebell single-leg deadlift (db/kb) card 1 round
   16 Dumbbell split-stance deadlift (db/kb) card 1 round
   14 Kettlebell swing (db/kb) card 2 round
   10 Barbell good mornings (barbell) card 1 round
   5 Zercher single-leg deadlift (other) card 1 round
   4 Sumo deadlift (barbell) card 1 lift
   4 Barbell Romanian deadlift (barbell) card 1 lift
   4 Dumbbell Romanian deadlift (db/kb) card 1 lift
   4 Kettlebell swing (db/kb) card 1 lift
   4 Kettlebell swing (db/kb) card 3 round
  runs on those days: {"Long Slow Distance (LSD)":29,"Long Ride (LSD)":21,"Long Run":15,"Recovery Run":11,"none":10,"Speed Run":9,"Short Interval (SI)":4,"Long Interval (LI)":4}

== HALF_MANNY | hinges 29 | by card {"1":15,"2":12,"3":2} | cold non-main 3
   4 card 1 Main lift Barbell Romanian deadlift (Posterior Chain) no lower before
   4 card 1 Main lift Trap bar deadlift (Posterior Chain) no lower before
   4 card 2 round Kettlebell swing (Leg Strength + Mobility)
   4 card 2 round Kettlebell single-leg deadlift (Leg Strength + Mobility)
   2 card 2 round Barbell Romanian deadlift (Leg Strength + Mobility)
   2 card 1 Main lift Sumo deadlift (Posterior Chain) no lower before
   2 card 3 round Kettlebell swing (Posterior Chain)
   2 card 1 Main lift Deadlift (Posterior Chain) no lower before
   2 card 2 round Dumbbell split-stance deadlift (Leg Strength + Mobility)
   2 card 1 lift Trap bar deadlift (Posterior Chain) no lower before
   1 card 1 lift Kettlebell swing (Full Body Support) no lower before
```
