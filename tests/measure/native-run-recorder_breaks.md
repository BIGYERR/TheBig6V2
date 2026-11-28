# The Expo app's Run recorder: a break per rule, and the test files each turns red

Written by `node tests/measure/native-run-recorder_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-run-recorder.test.ts`, `unit/native-shell.test.ts`, `unit/native-cardio-sheet.test.ts`, `unit/native-bugs-tab.test.ts`. Unbroken, they hold 149 tests and all pass.
- The recorder has no sweep: it reads and writes no stored state.

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `recorder-screen.ts` | a finished run keeps the day's line over it | **1** | 3 | unit/native-run-recorder 3 |
| 2 | `recorder-screen.ts` | a live run shows its start over it | **1** | 2 | unit/native-run-recorder 2 |
| 3 | `recorder-screen.ts` | a run card's recorder reads the test bench's note | **1** | 2 | unit/native-run-recorder 2 |
| 4 | `recorder-screen.ts` | the test bench reads no note | **1** | 2 | unit/native-run-recorder 2 |
| 5 | `recorder-screen.ts` | a finished run's start is drawn as iOS wrote it | **1** | 1 | unit/native-run-recorder 1 |
| 6 | `recorder-screen.ts` | a past run's start is drawn as iOS wrote it | **1** | 1 | unit/native-run-recorder 1 |
| 7 | `recorder-screen.ts` | only the first narrow space is drawn plain | **1** | 1 | unit/native-run-recorder 1 |
| 8 | `recorder-screen.ts` | the narrow space is drawn as nothing | **1** | 1 | unit/native-run-recorder 1 |
| 9 | `recorder-screen.ts` | a card with no name leaves the title blank | **1** | 1 | unit/native-run-recorder 1 |
| 10 | `recorder-screen.ts` | a run card's recorder is titled as the test bench | **1** | 1 | unit/native-run-recorder 1 |
| 11 | `recorder-screen.ts` | the test bench offers the hand log | **1** | 1 | unit/native-run-recorder 1 |
| 12 | `recorder-screen.ts` | a live run offers the hand log | **1** | 1 | unit/native-run-recorder 1 |
| 13 | `recorder-screen.ts` | a finished run offers the hand log | **1** | 1 | unit/native-run-recorder 1 |
| 14 | `recorder-screen.ts` | the screen opens no channel | **1** | 4 | unit/native-run-recorder 4 |
| 15 | `recorder-screen.ts` | the screen does not turn location on | **1** | 2 | unit/native-run-recorder 2 |
| 16 | `recorder-screen.ts` | location goes on before the channel opens | **1** | 2 | unit/native-run-recorder 2 |
| 17 | `recorder-screen.ts` | the screen does not read what the module holds as it opens | **1** | 6 | unit/native-run-recorder 6 |
| 18 | `recorder-screen.ts` | the screen leaves location on as it goes | **1** | 1 | unit/native-run-recorder 1 |
| 19 | `recorder-screen.ts` | the permission event is dropped | **1** | 1 | unit/native-run-recorder 1 |
| 20 | `recorder-screen.ts` | a fix is not kept for the GPS line | **1** | 1 | unit/native-run-recorder 1 |
| 21 | `recorder-screen.ts` | a recorded fix is counted before Start | **1** | 1 | unit/native-run-recorder 1 |
| 22 | `recorder-screen.ts` | a fix that was not recorded is counted | **1** | 1 | unit/native-run-recorder 1 |
| 23 | `recorder-screen.ts` | a step reading is counted before Start | **1** | 1 | unit/native-run-recorder 1 |
| 24 | `recorder-screen.ts` | a step reading is dropped | **1** | 1 | unit/native-run-recorder 1 |
| 25 | `recorder-screen.ts` | a mark is counted before Start | **1** | 1 | unit/native-run-recorder 1 |
| 26 | `recorder-screen.ts` | the start mark does not make the run live | **1** | 2 | unit/native-run-recorder 2 |
| 27 | `recorder-screen.ts` | the start mark is added to what the screen held | **1** | 1 | unit/native-run-recorder 1 |
| 28 | `recorder-screen.ts` | the start mark asks for no run id | **1** | 2 | unit/native-run-recorder 2 |
| 29 | `recorder-screen.ts` | the run id a start hands back is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 30 | `recorder-screen.ts` | every mark is read as a start | **1** | 1 | unit/native-run-recorder 1 |
| 31 | `recorder-screen.ts` | the module's error is not shown | **1** | 1 | unit/native-run-recorder 1 |
| 32 | `recorder-screen.ts` | an event is not drawn | **1** | 2 | unit/native-run-recorder 2 |
| 33 | `recorder-screen.ts` | a status that is not recording is read as a live run | **1** | 1 | unit/native-run-recorder 1 |
| 34 | `recorder-screen.ts` | a status with no run named is read as a live run | **1** | 1 | unit/native-run-recorder 1 |
| 35 | `recorder-screen.ts` | a run read back is not live | **1** | 4 | unit/native-run-recorder 4 |
| 36 | `recorder-screen.ts` | a run read back has no id | **1** | 2 | unit/native-run-recorder 2 |
| 37 | `recorder-screen.ts` | a live run is not read back from its file | **1** | 5 | unit/native-run-recorder 5 |
| 38 | `recorder-screen.ts` | a run read back is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 39 | `recorder-screen.ts` | the past runs are not listed as the screen opens | **1** | 7 | unit/native-run-recorder 7 |
| 40 | `recorder-screen.ts` | the status itself is not drawn | **1** | 2 | unit/native-run-recorder 2 |
| 41 | `recorder-screen.ts` | the live run is listed among the past runs | **1** | 4 | unit/native-run-recorder 4 |
| 42 | `recorder-screen.ts` | an empty list of past runs is not taken | **1** | 1 | unit/native-run-recorder 1 |
| 43 | `recorder-screen.ts` | an empty list of past runs is not drawn | **1** | 2 | unit/native-run-recorder 2 |
| 44 | `recorder-screen.ts` | the past runs are set when the first one answers | **1** | 1 | unit/native-run-recorder 1 |
| 45 | `recorder-screen.ts` | a past run carries no miles and time | **1** | 1 | unit/native-run-recorder 1 |
| 46 | `recorder-screen.ts` | the past runs stand oldest first | **1** | 3 | unit/native-run-recorder 3 |
| 47 | `recorder-screen.ts` | the past runs are not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 48 | `recorder-screen.ts` | a past run opens over a live one | **1** | 1 | unit/native-run-recorder 1 |
| 49 | `recorder-screen.ts` | a past run opened keeps the old message | **1** | 1 | unit/native-run-recorder 1 |
| 50 | `recorder-screen.ts` | a past run opened has no id | **1** | 6 | unit/native-run-recorder 6 |
| 51 | `recorder-screen.ts` | a past run opened draws no lines | **1** | 2 | unit/native-run-recorder 2 |
| 52 | `recorder-screen.ts` | a past run opened is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 53 | `recorder-screen.ts` | a tap keeps the old message | **1** | 1 | unit/native-run-recorder 1 |
| 54 | `recorder-screen.ts` | Start keeps the last run's id | **1** | 1 | unit/native-run-recorder 1 |
| 55 | `recorder-screen.ts` | Start keeps the last run's lines | **1** | 1 | unit/native-run-recorder 1 |
| 56 | `recorder-screen.ts` | Start starts nothing | **1** | 1 | unit/native-run-recorder 1 |
| 57 | `recorder-screen.ts` | Pause resumes | **1** | 1 | unit/native-run-recorder 1 |
| 58 | `recorder-screen.ts` | Resume pauses | **1** | 1 | unit/native-run-recorder 1 |
| 59 | `recorder-screen.ts` | a finished run is still live | **1** | 2 | unit/native-run-recorder 2 |
| 60 | `recorder-screen.ts` | a finished run has no id | **1** | 1 | unit/native-run-recorder 1 |
| 61 | `recorder-screen.ts` | a finished run is not read back | **1** | 2 | unit/native-run-recorder 2 |
| 62 | `recorder-screen.ts` | a finished run read back is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 63 | `recorder-screen.ts` | Finish does not list the past runs again | **1** | 2 | unit/native-run-recorder 2 |
| 64 | `recorder-screen.ts` | Finish's answer is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 65 | `recorder-screen.ts` | Finish refused says nothing | **1** | 1 | unit/native-run-recorder 1 |
| 66 | `recorder-screen.ts` | Finish refused is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 67 | `recorder-screen.ts` | Share with no run in hand shares | **1** | 1 | unit/native-run-recorder 1 |
| 68 | `recorder-screen.ts` | the shared file carries the run's id as its name | **1** | 2 | unit/native-run-recorder 2 |
| 69 | `recorder-screen.ts` | the shared file holds no run | **1** | 2 | unit/native-run-recorder 2 |
| 70 | `recorder-screen.ts` | a share that failed says nothing | **1** | 1 | unit/native-run-recorder 1 |
| 71 | `recorder-screen.ts` | a share that failed is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 72 | `recorder-screen.ts` | a share that ended is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 73 | `recorder-screen.ts` | a build with no share sheet says nothing | **1** | 1 | unit/native-run-recorder 1 |
| 74 | `recorder-screen.ts` | Delete asks in other words | **1** | 1 | unit/native-run-recorder 1 |
| 75 | `recorder-screen.ts` | Delete does not wait for the answer | **1** | 2 | unit/native-run-recorder 2 |
| 76 | `recorder-screen.ts` | Delete with no run in hand asks | **1** | 1 | unit/native-run-recorder 1 |
| 77 | `recorder-screen.ts` | a deleted run stays on the screen | **1** | 1 | unit/native-run-recorder 1 |
| 78 | `recorder-screen.ts` | Delete does not list the past runs again | **1** | 2 | unit/native-run-recorder 2 |
| 79 | `recorder-screen.ts` | a delete is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 80 | `recorder-screen.ts` | a delete refused says nothing | **1** | 1 | unit/native-run-recorder 1 |
| 81 | `recorder-screen.ts` | a delete refused is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 82 | `recorder-screen.ts` | a tap is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 83 | `recorder-screen.ts` | Back from a finished run closes the screen | **1** | 2 | unit/native-run-recorder 2 |
| 84 | `recorder-screen.ts` | Back from a live run clears it | **1** | 1 | unit/native-run-recorder 1 |
| 85 | `recorder-screen.ts` | Back from the start does nothing | **1** | 2 | unit/native-run-recorder 2 |
| 86 | `recorder-screen.ts` | Back to the start is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 87 | `recorder-screen.ts` | the start keeps the last run's id | **1** | 3 | unit/native-run-recorder 3 |
| 88 | `recorder-screen.ts` | the start keeps the last run's lines | **1** | 2 | unit/native-run-recorder 2 |
| 89 | `recorder-screen.ts` | the start keeps the last message | **1** | 1 | unit/native-run-recorder 1 |
| 90 | `recorder-screen.ts` | the draw does not know the run is live | **1** | 3 | unit/native-run-recorder 3 |
| 91 | `recorder-screen.ts` | the live clock stops at the run's last line | **1** | 1 | unit/native-run-recorder 1 |
| 92 | `recorder-screen.ts` | the draw does not know location is off | **1** | 1 | unit/native-run-recorder 1 |
| 93 | `recorder-screen.ts` | the GPS line does not follow the last fix | **1** | 1 | unit/native-run-recorder 1 |
| 94 | `recorder-screen.ts` | a tap breaks a build with no module | **1** | 1 | unit/native-run-recorder 1 |
| 95 | `recorder-screen.ts` | reading back breaks a build with no module | **1** | 1 | unit/native-run-recorder 1 |
| 96 | `gps-bridge.ts` | a second listen keeps the first channel open | **1** | 1 | unit/native-run-recorder 1 |
| 97 | `gps-bridge.ts` | listen opens no channel | **1** | 2 | unit/native-run-recorder 2 |
| 98 | `gps-bridge.ts` | listen does not ask for the permission as it stands | **1** | 2 | unit/native-run-recorder 2 |
| 99 | `gps-bridge.ts` | listen asks before the channel is open | **1** | 2 | unit/native-run-recorder 2 |
| 100 | `gps-bridge.ts` | the channel listens for another event | **1** | 2 | unit/native-run-recorder 2 |
| 101 | `gps-bridge.ts` | quiet leaves the channel open | **1** | 1 | unit/native-run-recorder 1 |
| 102 | `gps-bridge.ts` | a channel is closed twice | **1** | 1 | unit/native-run-recorder 1 |
| 103 | `gps-bridge.ts` | warm cools | **1** | 1 | unit/native-run-recorder 1 |
| 104 | `gps-bridge.ts` | cool warms | **1** | 1 | unit/native-run-recorder 1 |
| 105 | `gps-bridge.ts` | start pauses | **1** | 1 | unit/native-run-recorder 1 |
| 106 | `gps-bridge.ts` | pause resumes in the module | **1** | 1 | unit/native-run-recorder 1 |
| 107 | `gps-bridge.ts` | resume starts | **1** | 1 | unit/native-run-recorder 1 |
| 108 | `gps-bridge.ts` | a finish with no id is taken as done | **1** | 1 | unit/native-run-recorder 1 |
| 109 | `gps-bridge.ts` | a finish refused is taken as done | **1** | 1 | unit/native-run-recorder 1 |
| 110 | `gps-bridge.ts` | a finish refused gives no reason | **1** | 1 | unit/native-run-recorder 1 |
| 111 | `gps-bridge.ts` | a finish refused is told to no one | **1** | 2 | unit/native-run-recorder 2 |
| 112 | `gps-bridge.ts` | a finish the module throws on is silent | **1** | 1 | unit/native-run-recorder 1 |
| 113 | `gps-bridge.ts` | a read with no text is taken | **1** | 1 | unit/native-run-recorder 1 |
| 114 | `gps-bridge.ts` | a read refused is taken | **1** | 1 | unit/native-run-recorder 1 |
| 115 | `gps-bridge.ts` | a read refused gives no reason | **1** | 1 | unit/native-run-recorder 1 |
| 116 | `gps-bridge.ts` | a read the module throws on is silent | **1** | 1 | unit/native-run-recorder 1 |
| 117 | `gps-bridge.ts` | a delete refused is taken as done | **1** | 1 | unit/native-run-recorder 1 |
| 118 | `gps-bridge.ts` | a delete refused gives no reason | **1** | 1 | unit/native-run-recorder 1 |
| 119 | `gps-bridge.ts` | a delete the module throws on is silent | **1** | 1 | unit/native-run-recorder 1 |
| 120 | `gps-bridge.ts` | a thrown call gives no reason | **1** | 1 | unit/native-run-recorder 1 |
| 121 | `gps-bridge.ts` | a status hands back what the module wrote for recording | **1** | 1 | unit/native-run-recorder 1 |
| 122 | `gps-bridge.ts` | a status hands back what the module wrote for paused | **1** | 1 | unit/native-run-recorder 1 |
| 123 | `gps-bridge.ts` | a status with no id hands back none at all | **1** | 1 | unit/native-run-recorder 1 |
| 124 | `gps-bridge.ts` | the list hands back no runs | **1** | 1 | unit/native-run-recorder 1 |
| 125 | `gps-bridge.ts` | read asks for another run | **1** | 1 | unit/native-run-recorder 1 |
| 126 | `gps-bridge.ts` | remove asks for another run | **1** | 1 | unit/native-run-recorder 1 |
| 127 | `gps.ts` | the app asks for a module of another name | **1** | 1 | unit/native-run-recorder 1 |
| 128 | `gps.ts` | a build without the module still has a recorder | **1** | 1 | unit/native-run-recorder 1 |
| 129 | `gps.ts` | a lookup that throws breaks the app | **1** | 1 | unit/native-run-recorder 1 |
| 130 | `run-recorder-model.ts` | the model is no longer today's | **1** | 2 | unit/native-run-recorder 2 |
| 131 | `RunRecorder.tsx` | the first row draws This mile under Avg pace | **1** | 1 | unit/native-run-recorder 1 |
| 132 | `RunRecorder.tsx` | the first row draws no Miles | **1** | 1 | unit/native-run-recorder 1 |
| 133 | `RunRecorder.tsx` | the second row draws Steps under Climb | **1** | 1 | unit/native-run-recorder 1 |
| 134 | `RunRecorder.tsx` | the second row is not drawn | **1** | 1 | unit/native-run-recorder 1 |
| 135 | `RunRecorder.tsx` | a label is another word | **1** | 1 | unit/native-run-recorder 1 |
| 136 | `RunRecorder.tsx` | a split draws no climb | **1** | 1 | unit/native-run-recorder 1 |
| 137 | `RunRecorder.tsx` | a split's climb stands hard against its time | **1** | 1 | unit/native-run-recorder 1 |
| 138 | `RunRecorder.tsx` | a split is called a lap | **1** | 1 | unit/native-run-recorder 1 |
| 139 | `RunRecorder.tsx` | a past run draws its start alone | **1** | 1 | unit/native-run-recorder 1 |
| 140 | `RunRecorder.tsx` | a button draws its key | **1** | 1 | unit/native-run-recorder 1 |
| 141 | `RunRecorder.tsx` | Back presses nothing | **1** | 1 | unit/native-run-recorder 1 |
| 142 | `RunRecorder.tsx` | a button presses Start whatever it is | **1** | 1 | unit/native-run-recorder 1 |
| 143 | `RunRecorder.tsx` | a past run opens nothing | **1** | 1 | unit/native-run-recorder 1 |
| 144 | `RunRecorder.tsx` | Ran without the phone? goes nowhere | **1** | 1 | unit/native-run-recorder 1 |
| 145 | `RunRecorder.tsx` | Ran without the phone? is always drawn | **1** | 1 | unit/native-run-recorder 1 |
| 146 | `RunRecorder.tsx` | the message line is always drawn | **1** | 1 | unit/native-run-recorder 1 |
| 147 | `RunRecorder.tsx` | the splits are drawn with none | **1** | 1 | unit/native-run-recorder 1 |
| 148 | `RunRecorder.tsx` | the past runs are drawn with none | **1** | 1 | unit/native-run-recorder 1 |
| 149 | `RunRecorder.tsx` | the workout is not drawn above the clock | **1** | 2 | unit/native-run-recorder 2 |
| 150 | `RunRecorder.tsx` | the when line is not the rule's | **1** | 1 | unit/native-run-recorder 1 |
| 151 | `RunRecorder.tsx` | the title is not the rule's | **1** | 1 | unit/native-run-recorder 1 |
| 152 | `RunRecorder.tsx` | the hand log link reads other words | **1** | 1 | unit/native-run-recorder 1 |
| 153 | `RunRecorder.tsx` | the draw is not the model's | **1** | 1 | unit/native-run-recorder 1 |
| 154 | `RunRecorder.tsx` | the screen does not open the channel | **1** | 1 | unit/native-run-recorder 1 |
| 155 | `RunRecorder.tsx` | the clock ticks twice a second | **1** | 1 | unit/native-run-recorder 1 |
| 156 | `RunRecorder.tsx` | the run is read back as the app goes behind | **1** | 1 | unit/native-run-recorder 1 |
| 157 | `RunRecorder.tsx` | the run is not read back on the app's return | **1** | 1 | unit/native-run-recorder 1 |
| 158 | `RunRecorder.tsx` | the clock ticks on after the screen | **1** | 1 | unit/native-run-recorder 1 |
| 159 | `RunRecorder.tsx` | the app's return is listened for after the screen | **1** | 1 | unit/native-run-recorder 1 |
| 160 | `RunRecorder.tsx` | the channel stays open after the screen | **1** | 1 | unit/native-run-recorder 1 |
| 161 | `RunRecorder.tsx` | location stays on after the screen | **1** | 1 | unit/native-run-recorder 1 |
| 162 | `RunRecorder.tsx` | an answer after the screen is drawn | **1** | 1 | unit/native-run-recorder 1 |
| 163 | `RunRecorder.tsx` | the question stands under another name | **1** | 1 | unit/native-run-recorder 1 |
| 164 | `RunRecorder.tsx` | the question puts OK first | **1** | 1 | unit/native-run-recorder 1 |
| 165 | `RunRecorder.tsx` | Cancel deletes | **1** | 1 | unit/native-run-recorder 1 |
| 166 | `RunRecorder.tsx` | the shared run is written outside the cache | **2** | 2 | unit/native-run-recorder 1, unit/native-shell 1 |
| 167 | `RunRecorder.tsx` | the shared run is not written | **2** | 2 | unit/native-run-recorder 1, unit/native-shell 1 |
| 168 | `RunRecorder.tsx` | the share sheet is handed no file | **2** | 2 | unit/native-run-recorder 1, unit/native-shell 1 |
| 169 | `RunRecorder.tsx` | a share is never said to have ended | **1** | 1 | unit/native-run-recorder 1 |
| 170 | `RunRecorder.tsx` | a share that throws is not said to have failed | **1** | 1 | unit/native-run-recorder 1 |
| 171 | `RunRecorder.tsx` | the band's edge stands 13 under the title | **1** | 1 | unit/native-run-recorder 1 |
| 172 | `RunRecorder.tsx` | Back's word stands on its own line height | **1** | 1 | unit/native-run-recorder 1 |
| 173 | `RunRecorder.tsx` | Back is no pill | **1** | 1 | unit/native-run-recorder 1 |
| 174 | `RunRecorder.tsx` | the title stands hard under the when line | **1** | 1 | unit/native-run-recorder 1 |
| 175 | `RunRecorder.tsx` | the clock is 48 | **1** | 1 | unit/native-run-recorder 1 |
| 176 | `RunRecorder.tsx` | the clock stands 5 high in its line | **1** | 1 | unit/native-run-recorder 1 |
| 177 | `RunRecorder.tsx` | the first row's figures are 18 | **1** | 2 | unit/native-run-recorder 2 |
| 178 | `RunRecorder.tsx` | the first row stands 2 short | **1** | 1 | unit/native-run-recorder 1 |
| 179 | `RunRecorder.tsx` | the second row's figures are 24 | **1** | 2 | unit/native-run-recorder 2 |
| 180 | `RunRecorder.tsx` | the buttons are 48 tall | **1** | 1 | unit/native-run-recorder 1 |
| 181 | `RunRecorder.tsx` | the buttons have 11 of room | **1** | 1 | unit/native-run-recorder 1 |
| 182 | `RunRecorder.tsx` | the parts stand 16 apart | **1** | 1 | unit/native-run-recorder 1 |
| 183 | `RunRecorder.tsx` | the figures stand 14 apart | **1** | 1 | unit/native-run-recorder 1 |
| 184 | `RunRecorder.tsx` | a label stands hard over its figure | **1** | 1 | unit/native-run-recorder 1 |
| 185 | `RunRecorder.tsx` | the hand log link is short of 44 | **1** | 2 | unit/native-run-recorder 2 |
| 186 | `RunRecorder.tsx` | the hand log link is not underlined | **1** | 2 | unit/native-run-recorder 2 |
| 187 | `RunRecorder.tsx` | a split's line is the face's own | **1** | 1 | unit/native-run-recorder 1 |
| 188 | `RunRecorder.tsx` | a past run's pill is 39.7 tall | **1** | 1 | unit/native-run-recorder 1 |
| 189 | `RunRecorder.tsx` | Back's pill is clear | **1** | 1 | unit/native-run-recorder 1 |
| 190 | `RunRecorder.tsx` | the when line is as bright as the title | **1** | 2 | unit/native-run-recorder 2 |
| 191 | `RunRecorder.tsx` | the header is the page's ground | **1** | 1 | unit/native-run-recorder 1 |
| 192 | `RunRecorder.tsx` | the scroll ends hard on the last line | **1** | 1 | unit/native-run-recorder 1 |
| 193 | `RunRecorder.tsx` | the Bugs row reads another name | **1** | 1 | unit/native-run-recorder 1 |
| 194 | `RunRecorder.tsx` | the Bugs row has no note | **1** | 1 | unit/native-run-recorder 1 |
| 195 | `RunRecorder.tsx` | the Bugs row's button says Start | **1** | 1 | unit/native-run-recorder 1 |
| 196 | `RunRecorder.tsx` | the Bugs row's button opens nothing | **1** | 1 | unit/native-run-recorder 1 |
| 197 | `RecordOpening.tsx` | a way out is taken while it still opens | **1** | 1 | unit/native-run-recorder 1 |
| 198 | `RecordOpening.tsx` | the hand log opens before the recorder has gone | **1** | 1 | unit/native-run-recorder 1 |
| 199 | `RecordOpening.tsx` | the hand log never opens | **1** | 1 | unit/native-run-recorder 1 |
| 200 | `RecordOpening.tsx` | the app is never told it closed | **1** | 1 | unit/native-run-recorder 1 |
| 201 | `RecordOpening.tsx` | a still recorder plays the close | **1** | 1 | unit/native-run-recorder 1 |
| 202 | `RecordOpening.tsx` | the close is not played | **1** | 1 | unit/native-run-recorder 1 |
| 203 | `RecordOpening.tsx` | it moves under Reduce Motion | **1** | 1 | unit/native-run-recorder 1 |
| 204 | `RecordOpening.tsx` | it moves with no card to open out of | **1** | 1 | unit/native-run-recorder 1 |
| 205 | `RecordOpening.tsx` | Ran without the phone? closes and no more | **1** | 1 | unit/native-run-recorder 1 |
| 206 | `RecordOpening.tsx` | Back does not close into the card | **1** | 1 | unit/native-run-recorder 1 |
| 207 | `RecordOpening.tsx` | the recorder opens under the test bench's words | **1** | 1 | unit/native-run-recorder 1 |
| 208 | `RecordOpening.tsx` | the recorder opens without the run's workout | **1** | 1 | unit/native-run-recorder 1 |
| 209 | `RecordOpening.tsx` | the words over it are another run's title | **1** | 1 | unit/native-run-recorder 1 |
| 210 | `RecordOpening.tsx` | a tap lands while it moves | **1** | 1 | unit/native-run-recorder 1 |
| 211 | `RecordOpening.tsx` | the lift waits 16 ms | **1** | 1 | unit/native-run-recorder 1 |
| 212 | `RecordOpening.tsx` | it opens before it lifts | **1** | 1 | unit/native-run-recorder 1 |
| 213 | `RecordOpening.tsx` | the frame opens from the screen's corner | **1** | 1 | unit/native-run-recorder 1 |
| 214 | `RecordOpening.tsx` | the copy of the card draws its buttons | **1** | 1 | unit/native-run-recorder 1 |
| 215 | `RecordOpening.tsx` | the copy of the card stays over the open recorder | **1** | 1 | unit/native-run-recorder 1 |
| 216 | `RecordOpening.tsx` | a still recorder is drawn on no ground | **1** | 1 | unit/native-run-recorder 1 |
| 217 | `ThisWeek.tsx` | Record run is offered on a build with no recorder | **1** | 1 | unit/native-run-recorder 1 |
| 218 | `ThisWeek.tsx` | Record run opens the hand log | **2** | 2 | unit/native-cardio-sheet 1, unit/native-run-recorder 1 |
| 219 | `ThisWeek.tsx` | Record run opens the deck | **2** | 2 | unit/native-cardio-sheet 1, unit/native-run-recorder 1 |
| 220 | `ThisWeek.tsx` | the recorder opens under the card's label | **1** | 1 | unit/native-run-recorder 1 |
| 221 | `ThisWeek.tsx` | the recorder opens with no when line | **1** | 1 | unit/native-run-recorder 1 |
| 222 | `ThisWeek.tsx` | a card with no place records nothing | **1** | 1 | unit/native-run-recorder 1 |
| 223 | `ThisWeek.tsx` | Record run hands on no place for the card | **1** | 1 | unit/native-run-recorder 1 |
| 224 | `ThisWeek.tsx` | the day's cards are handed no recorder | **1** | 1 | unit/native-run-recorder 1 |
| 225 | `ThisWeek.tsx` | a card is handed no recorder | **1** | 1 | unit/native-run-recorder 1 |
| 226 | `ThisWeek.tsx` | the run recorded carries no workout | **1** | 1 | unit/native-run-recorder 1 |
| 227 | `ThisWeek.tsx` | Ran without the phone? opens the whole day | **1** | 1 | unit/native-run-recorder 1 |
| 228 | `ThisWeek.tsx` | the run recorded carries another week's day | **1** | 1 | unit/native-run-recorder 1 |
| 229 | `ThisWeek.tsx` | Record run records with no program in hand | **1** | 1 | unit/native-run-recorder 1 |
| 230 | `App.tsx` | This Week is handed a recorder on a build with none | **1** | 1 | unit/native-run-recorder 1 |
| 231 | `App.tsx` | Record run opens nothing | **1** | 1 | unit/native-run-recorder 1 |
| 232 | `App.tsx` | the recorder forgets the card it opened out of | **1** | 1 | unit/native-run-recorder 1 |
| 233 | `App.tsx` | the recorder out of a card moves under Reduce Motion | **1** | 1 | unit/native-run-recorder 1 |
| 234 | `App.tsx` | the recorder out of a card is never taken away | **1** | 1 | unit/native-run-recorder 1 |
| 235 | `App.tsx` | This Week does not shrink under the recorder | **1** | 1 | unit/native-run-recorder 1 |
| 236 | `App.tsx` | the recorder out of a card is drawn under the tab bar's screens | **1** | 1 | unit/native-run-recorder 1 |
| 237 | `App.tsx` | the Bugs row is drawn on a build with no recorder | **1** | 1 | unit/native-run-recorder 1 |
| 238 | `App.tsx` | the Bugs row opens nothing | **1** | 1 | unit/native-run-recorder 1 |
| 239 | `App.tsx` | the test bench opens under a card's words | **1** | 1 | unit/native-run-recorder 1 |
| 240 | `App.tsx` | the test bench cannot be closed | **1** | 1 | unit/native-run-recorder 1 |
| 241 | `Bugs.tsx` | the Bugs row is drawn with no recorder to open | **2** | 2 | unit/native-bugs-tab 1, unit/native-run-recorder 1 |
| 242 | `Bugs.tsx` | the Bugs row stands above Engine | **2** | 2 | unit/native-bugs-tab 1, unit/native-run-recorder 1 |
| 243 | `IAGps.swift` | a run stops when the phone locks | **1** | 1 | unit/native-run-recorder 1 |
| 244 | `IAGps.swift` | iOS may pause the fixes by itself | **1** | 2 | unit/native-run-recorder 2 |
| 245 | `IAGps.swift` | the fixes are coarse | **1** | 2 | unit/native-run-recorder 2 |
| 246 | `IAGps.swift` | a fix every 10 m only | **1** | 2 | unit/native-run-recorder 2 |
| 247 | `IAGps.swift` | location is asked for always | **1** | 2 | unit/native-run-recorder 2 |
| 248 | `IAGps.swift` | a fix is not written to the run's file | **1** | 1 | unit/native-run-recorder 1 |
| 249 | `IAGps.swift` | fixes are sent while the app is behind | **1** | 2 | unit/native-run-recorder 2 |
| 250 | `IAGps.swift` | a step reading is written with no run | **1** | 1 | unit/native-run-recorder 1 |
| 251 | `IAGps.swift` | the steps are counted from the phone's day | **1** | 2 | unit/native-run-recorder 2 |
| 252 | `IAGps.swift` | the pause mark is written twice | **1** | 2 | unit/native-run-recorder 2 |
| 253 | `IAGps.swift` | the finish mark is not written | **1** | 1 | unit/native-run-recorder 1 |
| 254 | `IAGps.swift` | the sensors run on after Finish | **1** | 1 | unit/native-run-recorder 1 |
| 255 | `IAGps.swift` | the file stays open after Finish | **1** | 1 | unit/native-run-recorder 1 |
| 256 | `IAGps.swift` | the blue pill stays after Finish | **1** | 1 | unit/native-run-recorder 1 |
| 257 | `IAGps.swift` | a run is kept in another folder | **1** | 2 | unit/native-run-recorder 2 |
| 258 | `IAGps.swift` | a run is kept in Documents | **1** | 2 | unit/native-run-recorder 2 |
| 259 | `IAGps.swift` | a call can name any file | **1** | 2 | unit/native-run-recorder 2 |
| 260 | `IAGps.swift` | a run id may hold a path | **1** | 2 | unit/native-run-recorder 2 |
| 261 | `IAGps.swift` | the run recording can be deleted | **1** | 1 | unit/native-run-recorder 1 |
| 262 | `IAGps.swift` | the lines run together in the file | **1** | 1 | unit/native-run-recorder 1 |
| 263 | `IAGps.swift` | a refusal answers ok | **1** | 1 | unit/native-run-recorder 1 |
| 264 | `IAGps.swift` | Finish answers with no id | **1** | 1 | unit/native-run-recorder 1 |
| 265 | `IAGps.swift` | a read answers with no text | **1** | 1 | unit/native-run-recorder 1 |
| 266 | `IAGps.swift` | a status names no run | **1** | 2 | unit/native-run-recorder 2 |
| 267 | `IAGps.swift` | the run starts before permission is given | **1** | 2 | unit/native-run-recorder 2 |
| 268 | `IAGps.swift` | a refused permission is not told | **1** | 1 | unit/native-run-recorder 1 |
| 269 | `IAGps.swift` | the events go nowhere | **1** | 1 | unit/native-run-recorder 1 |
| 270 | `IAGpsModule.swift` | a call runs off the main queue | **1** | 1 | unit/native-run-recorder 1 |
| 271 | `IAGpsModule.swift` | a call has another name | **1** | 1 | unit/native-run-recorder 1 |
| 272 | `IAGpsModule.swift` | Resume is wired to Pause | **1** | 1 | unit/native-run-recorder 1 |
| 273 | `IAGpsModule.swift` | the event has another name | **1** | 1 | unit/native-run-recorder 1 |
| 274 | `IAGpsModule.swift` | the event is sent under another name | **1** | 1 | unit/native-run-recorder 1 |
| 275 | `IAGpsModule.swift` | the module has another name | **1** | 1 | unit/native-run-recorder 1 |
| 276 | `IAGpsModule.swift` | read takes no id | **1** | 1 | unit/native-run-recorder 1 |
| 277 | `expo-module.config.json` | Expo is told of another module | **1** | 1 | unit/native-run-recorder 1 |
| 278 | `IAGps.podspec` | the module links no Core Motion | **1** | 1 | unit/native-run-recorder 1 |
| 279 | `IAGps.podspec` | the module asks for iOS 17 | **1** | 1 | unit/native-run-recorder 1 |
| 280 | `IAGps.podspec` | the module does not depend on Expo's core | **1** | 1 | unit/native-run-recorder 1 |
| 281 | `app.config.js` | the app gives no reason for location | **1** | 1 | unit/native-run-recorder 1 |
| 282 | `app.config.js` | the app gives another reason for location | **1** | 1 | unit/native-run-recorder 1 |
| 283 | `app.config.js` | the app gives no reason for motion | **1** | 1 | unit/native-run-recorder 1 |
| 284 | `app.config.js` | the app has no location background mode | **1** | 1 | unit/native-run-recorder 1 |
| 285 | `app.config.js` | the app asks for another background mode too | **1** | 1 | unit/native-run-recorder 1 |
| 286 | `app.config.js` | the app asks for an entitlement | **1** | 1 | unit/native-run-recorder 1 |

- Breaks made: **286** of 286. Let through by every file: **0**.
