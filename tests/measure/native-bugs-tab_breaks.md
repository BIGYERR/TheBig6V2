# The Expo app's Bugs tab: a break per rule, and the test files each turns red

Written by `node tests/measure/native-bugs-tab_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-bugs-tab.test.ts`, `integration/native-bugs-tab.test.ts`, `unit/native-shell.test.ts`, `unit/native-backup-import.test.ts`. Unbroken, they hold 80 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-bugs-tab.test.ts` (1 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `bugs-screen.ts` | the look read takes any stored word | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 2 | `bugs-screen.ts` | the look read never reads Day | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 3 | `bugs-screen.ts` | the look read never reads Night | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 4 | `bugs-screen.ts` | the look read throws on a store that cannot be read | **1** | 1 | unit/native-bugs-tab 1 |
| 5 | `bugs-screen.ts` | the look is stored under another key | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 6 | `bugs-screen.ts` | Auto draws day on a dark phone | **1** | 1 | unit/native-bugs-tab 1 |
| 7 | `bugs-screen.ts` | Auto draws night on a light phone | **1** | 1 | unit/native-bugs-tab 1 |
| 8 | `bugs-screen.ts` | the phone outranks a stored look | **1** | 1 | unit/native-bugs-tab 1 |
| 9 | `bugs-writes.ts` | a tap stores Auto as a word | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 10 | `bugs-writes.ts` | a tap on Day removes the key | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 11 | `bugs-writes.ts` | a tap on Auto leaves the key | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 12 | `bugs-writes.ts` | a store that refuses the look throws | **1** | 1 | unit/native-bugs-tab 1 |
| 13 | `bugs-screen.ts` | the beta saves under today's kind | **2** | 12 | integration/native-bugs-tab 2, unit/native-bugs-tab 10 |
| 14 | `bugs-screen.ts` | the beta's kind is another word | **1** | 10 | unit/native-bugs-tab 10 |
| 15 | `bugs-screen.ts` | the file's name carries the day in UTC | **1** | 1 | unit/native-bugs-tab 1 |
| 16 | `bugs-screen.ts` | the file's name does not pad its month | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 17 | `bugs-screen.ts` | the file's name counts months from zero | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 18 | `bugs-screen.ts` | the file's name is today's | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 19 | `bugs-screen.ts` | the snapshot keeps core's kind | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 20 | `bugs-screen.ts` | the snapshot puts its kind last | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 21 | `bugs-writes.ts` | a save reads the clock's zero for its instant | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 22 | `bugs-writes.ts` | a phone with no program saves a file | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 23 | `bugs-writes.ts` | a phone with one program saves nothing | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 24 | `bugs-writes.ts` | nothing to save says the save failed | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 25 | `bugs-writes.ts` | the saved text is its data alone | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 26 | `bugs-writes.ts` | the saved text is indented | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 27 | `bugs-writes.ts` | the toast for nothing to save is another | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 28 | `bugs-writes.ts` | the toast for a failed share is another | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 29 | `bugs-writes.ts` | the toast for a refused load is another | **2** | 4 | unit/native-bugs-tab 3, integration/native-bugs-tab 1 |
| 30 | `bugs-screen.ts` | the beta does not read its own kind | **2** | 8 | integration/native-bugs-tab 1, unit/native-bugs-tab 7 |
| 31 | `bugs-screen.ts` | every kind is read as today's | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 32 | `bugs-screen.ts` | a file that is null stops the read | **1** | 2 | unit/native-bugs-tab 2 |
| 33 | `bugs-screen.ts` | the beta's own file is handed on without its kind changed | **2** | 8 | integration/native-bugs-tab 1, unit/native-bugs-tab 7 |
| 34 | `bugs-screen.ts` | the beta's own file is handed on as format 1 whatever its format | **2** | 3 | unit/native-bugs-tab 2, integration/native-bugs-tab 1 |
| 35 | `bugs-screen.ts` | the read skips core's reader for its own kind | **2** | 7 | integration/native-bugs-tab 1, unit/native-bugs-tab 6 |
| 36 | `bugs-screen.ts` | a newer file is called not a backup | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 37 | `bugs-screen.ts` | a file that is not a backup is called newer | **2** | 3 | unit/native-bugs-tab 2, integration/native-bugs-tab 1 |
| 38 | `bugs-screen.ts` | the line gives the day in UTC | **1** | 1 | unit/native-bugs-tab 1 |
| 39 | `bugs-screen.ts` | the line gives the month as a number | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 40 | `bugs-screen.ts` | the line names a day that is no date | **1** | 1 | unit/native-bugs-tab 1 |
| 41 | `bugs-screen.ts` | the line never names the day | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 42 | `bugs-screen.ts` | the months are a month late | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 43 | `bugs-screen.ts` | September is written Sept | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 44 | `bugs-screen.ts` | one program reads programs | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 45 | `bugs-screen.ts` | no program reads program | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 46 | `bugs-screen.ts` | the line says everything here | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 47 | `bugs-screen.ts` | a file that cannot be read shows no line | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 48 | `bugs-screen.ts` | a file that cannot be read is called newer | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 49 | `bugs-screen.ts` | a file turned away leaves the waiting one | **2** | 2 | unit/native-bugs-tab 1, integration/native-bugs-tab 1 |
| 50 | `bugs-screen.ts` | a file picked shows no line | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 51 | `bugs-screen.ts` | Cancel leaves the line | **2** | 4 | integration/native-bugs-tab 1, unit/native-bugs-tab 3 |
| 52 | `bugs-screen.ts` | Cancel leaves the question | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 53 | `bugs-writes.ts` | Load it clears the block before the app starts afresh | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 54 | `bugs-writes.ts` | a refused load starts the app afresh | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 55 | `bugs-writes.ts` | a refused load is silent | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 56 | `bugs-writes.ts` | a refused load leaves the question up | **2** | 2 | unit/native-bugs-tab 1, integration/native-bugs-tab 1 |
| 57 | `bugs-writes.ts` | Load it with nothing waiting leaves the line | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 58 | `bugs-writes.ts` | Load it with nothing waiting starts the app afresh | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 59 | `bugs-writes.ts` | a load that did not take is called loaded | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 60 | `bugs-writes.ts` | a load that took is called refused | **2** | 5 | integration/native-bugs-tab 2, unit/native-bugs-tab 3 |
| 61 | `backup-import.ts` | a refused write is called loaded | **1** | 1 | unit/native-backup-import 1 |
| 62 | `backup-import.ts` | a key that does not match is let through | **2** | 3 | unit/native-backup-import 2, unit/native-bugs-tab 1 |
| 63 | `backup-import.ts` | a mismatch keeps what was loaded | **2** | 3 | unit/native-backup-import 2, unit/native-bugs-tab 1 |
| 64 | `backup-import.ts` | a mismatch is called a refusal | **2** | 3 | unit/native-backup-import 2, unit/native-bugs-tab 1 |
| 65 | `backup-import.ts` | the load is never checked | **2** | 3 | unit/native-backup-import 2, unit/native-bugs-tab 1 |
| 66 | `bugs-screen.ts` | a start with a program opens Programs | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 67 | `bugs-screen.ts` | a start with no program after a load opens Bugs | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 68 | `bugs-screen.ts` | a cold start with no program opens Programs | **1** | 2 | unit/native-bugs-tab 2 |
| 69 | `bugs-screen.ts` | a start opens This Week with no program | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 70 | `bugs-writes.ts` | a start that opens no program leaves a pointer that leads nowhere | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 71 | `bugs-writes.ts` | a start that opens a program writes its pointer before This Week mounts | **1** | 1 | unit/native-bugs-tab 1 |
| 72 | `bugs-writes.ts` | only a start after a load clears the pointer | **1** | 1 | unit/native-bugs-tab 1 |
| 73 | `bugs-writes.ts` | nothing typed sends a report | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 74 | `bugs-writes.ts` | nothing typed is not drawn | **1** | 1 | unit/native-bugs-tab 1 |
| 75 | `bugs-writes.ts` | spaces alone are sent | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 76 | `bugs-writes.ts` | nothing typed shows no line | **2** | 2 | integration/native-bugs-tab 1, unit/native-bugs-tab 1 |
| 77 | `bugs-writes.ts` | a context that cannot be read stops the send | **1** | 1 | unit/native-bugs-tab 1 |
| 78 | `bugs-writes.ts` | the report goes with no context | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 79 | `bugs-writes.ts` | the button does not wait while the report is out | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 80 | `bugs-writes.ts` | the wait is not drawn | **1** | 1 | unit/native-bugs-tab 1 |
| 81 | `bugs-writes.ts` | the old line stays while the report is out | **1** | 1 | integration/native-bugs-tab 1 |
| 82 | `bugs-writes.ts` | the button waits after the report came back | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 83 | `bugs-writes.ts` | a report filed leaves its text | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 84 | `bugs-writes.ts` | a report that failed loses its text | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 85 | `bugs-writes.ts` | the line after a send is not drawn | **1** | 1 | unit/native-bugs-tab 1 |
| 86 | `bugs-writes.ts` | every send says sent | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 87 | `bugs-writes.ts` | a report filed raises no toast | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 88 | `bugs-writes.ts` | a report that failed raises the toast | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 89 | `bugs-screen.ts` | the context's build carries no v | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 90 | `bugs-screen.ts` | the context does not name iOS | **1** | 1 | unit/native-bugs-tab 1 |
| 91 | `bugs-screen.ts` | the context does not say whether Swift answered | **1** | 1 | unit/native-bugs-tab 1 |
| 92 | `bugs-screen.ts` | the context says it runs in a browser's tab | **1** | 1 | unit/native-bugs-tab 1 |
| 93 | `bugs-screen.ts` | the context names no program | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 94 | `bugs-screen.ts` | the context swaps the window's sides | **1** | 1 | unit/native-bugs-tab 1 |
| 95 | `bugs-screen.ts` | the context's week is always the first | **2** | 3 | integration/native-bugs-tab 2, unit/native-bugs-tab 1 |
| 96 | `bugs-screen.ts` | the app's id is today's | **1** | 1 | unit/native-bugs-tab 1 |
| 97 | `bug-report-model.ts` | the model's report goes to another address | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 98 | `bug-report-model.ts` | the model calls a refusal sent | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 99 | `bug-report-model.ts` | the model's subject is another | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 100 | `bug-report-model.ts` | the model's line for a network error is another | **2** | 3 | integration/native-bugs-tab 1, unit/native-bugs-tab 2 |
| 101 | `bugs-screen.ts` | the title is Bugs | **1** | 2 | unit/native-bugs-tab 2 |
| 102 | `bugs-screen.ts` | the button says Send | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 103 | `bugs-screen.ts` | the wait says Sending with three dots | **2** | 4 | integration/native-bugs-tab 2, unit/native-bugs-tab 2 |
| 104 | `bugs-screen.ts` | the look's note is another | **1** | 2 | unit/native-bugs-tab 2 |
| 105 | `bugs-screen.ts` | Your data's note is another | **1** | 2 | unit/native-bugs-tab 2 |
| 106 | `bugs-screen.ts` | Load it says Load | **1** | 2 | unit/native-bugs-tab 2 |
| 107 | `bugs-screen.ts` | D289's words are gone | **1** | 1 | unit/native-bugs-tab 1 |
| 108 | `bugs-screen.ts` | the build's label carries no v | **1** | 1 | unit/native-bugs-tab 1 |
| 109 | `Bugs.tsx` | the report's button takes a tap while a report is out | **1** | 1 | unit/native-bugs-tab 1 |
| 110 | `Bugs.tsx` | a second tap while a report is out sends again | **1** | 1 | unit/native-bugs-tab 1 |
| 111 | `Bugs.tsx` | the button keeps its word while it waits | **1** | 1 | unit/native-bugs-tab 1 |
| 112 | `Bugs.tsx` | the button does not dim while it waits | **1** | 1 | unit/native-bugs-tab 1 |
| 113 | `Bugs.tsx` | every line under the button is drawn muted | **1** | 1 | unit/native-bugs-tab 1 |
| 114 | `Bugs.tsx` | a filed report's line is drawn red | **1** | 1 | unit/native-bugs-tab 1 |
| 115 | `Bugs.tsx` | the report's toast is not spoken | **1** | 1 | unit/native-bugs-tab 1 |
| 116 | `Bugs.tsx` | the field does not hold what is typed | **1** | 1 | unit/native-bugs-tab 1 |
| 117 | `Bugs.tsx` | the field shows no hint | **1** | 1 | unit/native-bugs-tab 1 |
| 118 | `Bugs.tsx` | the report is not told whether Swift answered | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 119 | `Bugs.tsx` | the report is told the engine check's version | **1** | 1 | unit/native-bugs-tab 1 |
| 120 | `Bugs.tsx` | a drag does not close the keys | **1** | 1 | unit/native-bugs-tab 1 |
| 121 | `Bugs.tsx` | a save with nothing to save says nothing | **1** | 1 | unit/native-bugs-tab 1 |
| 122 | `Bugs.tsx` | the file is written outside the cache | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 123 | `Bugs.tsx` | the file is shared before it is written | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 124 | `Bugs.tsx` | a failed share is silent | **1** | 1 | unit/native-bugs-tab 1 |
| 125 | `Bugs.tsx` | the share sheet is handed the file's text | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 126 | `Bugs.tsx` | the picker hands over the file itself | **1** | 1 | unit/native-shell 1 |
| 127 | `Bugs.tsx` | a picker closed with no file shows a line | **1** | 1 | unit/native-bugs-tab 1 |
| 128 | `Bugs.tsx` | a picked file is not drawn | **1** | 1 | unit/native-bugs-tab 1 |
| 129 | `Bugs.tsx` | a load that takes stays on Bugs | **1** | 1 | unit/native-bugs-tab 1 |
| 130 | `Bugs.tsx` | a refused load's toast is not spoken | **1** | 1 | unit/native-bugs-tab 1 |
| 131 | `Bugs.tsx` | the question is up with no file waiting | **1** | 1 | unit/native-bugs-tab 1 |
| 132 | `Bugs.tsx` | the line under Your data is not drawn | **1** | 1 | unit/native-bugs-tab 1 |
| 133 | `Bugs.tsx` | D289's words are not drawn | **1** | 2 | unit/native-bugs-tab 2 |
| 134 | `Bugs.tsx` | Cancel loads the file | **1** | 1 | unit/native-bugs-tab 1 |
| 135 | `Bugs.tsx` | Day is drawn on under every look | **1** | 1 | unit/native-bugs-tab 1 |
| 136 | `Bugs.tsx` | Night's button sets Day | **1** | 1 | unit/native-bugs-tab 1 |
| 137 | `Bugs.tsx` | Auto is never drawn on | **1** | 1 | unit/native-bugs-tab 1 |
| 138 | `Bugs.tsx` | the build's label is the bare version | **1** | 1 | unit/native-bugs-tab 1 |
| 139 | `Bugs.tsx` | Engine stands above Look | **1** | 1 | unit/native-bugs-tab 1 |
| 140 | `Bugs.tsx` | the body's parts stand 12 apart | **1** | 1 | unit/native-bugs-tab 1 |
| 141 | `Bugs.tsx` | the field is a line high | **1** | 1 | unit/native-bugs-tab 1 |
| 142 | `Bugs.tsx` | the field's corners are square | **1** | 1 | unit/native-bugs-tab 1 |
| 143 | `Bugs.tsx` | the field keeps its edge when it is in use | **1** | 1 | unit/native-bugs-tab 1 |
| 144 | `Bugs.tsx` | the send button is square | **1** | 1 | unit/native-bugs-tab 1 |
| 145 | `Bugs.tsx` | the intro's line is the CSS's fraction | **1** | 1 | unit/native-bugs-tab 1 |
| 146 | `Bugs.tsx` | the context note's line is the CSS's fraction | **1** | 1 | unit/native-bugs-tab 1 |
| 147 | `Bugs.tsx` | the line under the button takes no room when empty | **1** | 1 | unit/native-bugs-tab 1 |
| 148 | `Bugs.tsx` | the build's label is in the system's monospace | **1** | 1 | unit/native-bugs-tab 1 |
| 149 | `Bugs.tsx` | the build's label stands 2 higher | **1** | 1 | unit/native-bugs-tab 1 |
| 150 | `Bugs.tsx` | the screen's name stands a pixel low | **1** | 1 | unit/native-bugs-tab 1 |
| 151 | `Bugs.tsx` | the top bar stands still while the body scrolls | **1** | 1 | unit/native-bugs-tab 1 |
| 152 | `Bugs.tsx` | the foot leaves no room for the tab bar | **1** | 1 | unit/native-bugs-tab 1 |
| 153 | `rows.tsx` | the chosen look is drawn as the others | **1** | 1 | unit/native-bugs-tab 1 |
| 154 | `rows.tsx` | the chosen look's word is muted | **1** | 1 | unit/native-bugs-tab 1 |
| 155 | `rows.tsx` | an empty note keeps a line's height | **1** | 1 | unit/native-bugs-tab 1 |
| 156 | `rows.tsx` | a row has no rule above it | **1** | 1 | unit/native-bugs-tab 1 |
| 157 | `rows.tsx` | a row's rule is the second border's colour | **1** | 1 | unit/native-bugs-tab 1 |
| 158 | `rows.tsx` | the pills are squares | **1** | 1 | unit/native-bugs-tab 1 |
| 159 | `rows.tsx` | a pill is 2 points taller | **1** | 1 | unit/native-bugs-tab 1 |
| 160 | `rows.tsx` | the label is at the sheet's 11 | **1** | 1 | unit/native-bugs-tab 1 |
| 161 | `rows.tsx` | the note's words sit where iOS puts them | **1** | 1 | unit/native-bugs-tab 1 |
| 162 | `rows.tsx` | the pills stand 4 apart | **1** | 1 | unit/native-bugs-tab 1 |
| 163 | `EngineCheck.tsx` | the Engine row's label is another | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 164 | `EngineCheck.tsx` | the check's button never says Checking | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 165 | `EngineCheck.tsx` | the check's line is not drawn | **1** | 1 | unit/native-bugs-tab 1 |
| 166 | `EngineCheck.tsx` | the check's note is another | **1** | 1 | unit/native-shell 1 |
| 167 | `App.tsx` | the app draws by the phone alone | **1** | 1 | unit/native-bugs-tab 1 |
| 168 | `App.tsx` | iOS is told Night under Auto | **1** | 1 | unit/native-bugs-tab 1 |
| 169 | `App.tsx` | iOS is told the look once, at the start | **1** | 1 | unit/native-bugs-tab 1 |
| 170 | `App.tsx` | a look tapped is not read back | **1** | 1 | unit/native-bugs-tab 1 |
| 171 | `App.tsx` | a look tapped is not stored | **1** | 1 | unit/native-bugs-tab 1 |
| 172 | `App.tsx` | the look at a start is Auto whatever is stored | **1** | 1 | unit/native-bugs-tab 1 |
| 173 | `App.tsx` | the shell is not built again after a load | **1** | 1 | unit/native-bugs-tab 1 |
| 174 | `App.tsx` | a start after a load is a cold start | **1** | 1 | unit/native-bugs-tab 1 |
| 175 | `App.tsx` | Load it does not reach the app | **1** | 1 | unit/native-bugs-tab 1 |
| 176 | `App.tsx` | the first tab is read without the start's write | **1** | 1 | unit/native-bugs-tab 1 |
| 177 | `App.tsx` | the report is told the first week | **1** | 1 | unit/native-bugs-tab 1 |
| 178 | `App.tsx` | the report is told no program | **1** | 1 | unit/native-bugs-tab 1 |
| 179 | `App.tsx` | the tab's state is made anew at each draw of the app | **1** | 1 | unit/native-bugs-tab 1 |
| 180 | `Bugs.tsx` | the report typed is the screen's own, lost with a visit to another tab | **1** | 1 | unit/native-bugs-tab 1 |
| 181 | `Bugs.tsx` | the waiting file is the screen's own | **1** | 1 | unit/native-bugs-tab 1 |
| 182 | `Bugs.tsx` | the engine check is the screen's own | **1** | 1 | unit/native-bugs-tab 1 |
| 183 | `Bugs.tsx` | the tab's state shares one report between two makes | **1** | 1 | unit/native-bugs-tab 1 |
| 184 | `EngineCheck.tsx` | the row never hears a line | **1** | 1 | unit/native-bugs-tab 1 |
| 185 | `EngineCheck.tsx` | the row goes on listening once it is gone | **1** | 1 | unit/native-bugs-tab 1 |
| 186 | `EngineCheck.tsx` | the row draws a line of its own | **1** | 1 | unit/native-bugs-tab 1 |
| 187 | `EngineCheck.tsx` | the row's button starts nothing | **1** | 1 | unit/native-bugs-tab 1 |
| 188 | `engine-check-state.ts` | a second tap starts a second run | **1** | 1 | unit/native-bugs-tab 1 |
| 189 | `engine-check-state.ts` | a run that ended blocks the next | **1** | 1 | unit/native-bugs-tab 1 |
| 190 | `engine-check-state.ts` | the screen is not told when a run starts | **1** | 1 | unit/native-bugs-tab 1 |
| 191 | `engine-check-state.ts` | the screen is not told a slice's line | **1** | 1 | unit/native-bugs-tab 1 |
| 192 | `engine-check-state.ts` | the check stops with no screen up | **1** | 1 | unit/native-bugs-tab 1 |
| 193 | `engine-check-state.ts` | a run that ended still reads as running | **1** | 1 | unit/native-bugs-tab 1 |
| 194 | `engine-check-state.ts` | the line kept is the start's | **1** | 1 | unit/native-bugs-tab 1 |
| 195 | `engine-check-state.ts` | a run starts with no line | **1** | 1 | unit/native-bugs-tab 1 |
| 196 | `engine-check-state.ts` | the check times its slices on the date | **2** | 2 | unit/native-bugs-tab 1, unit/native-shell 1 |
| 197 | `engine-check-state.ts` | a new state starts as running | **1** | 1 | unit/native-bugs-tab 1 |

- Breaks made: **197** of 197. Let through by the fast files, so swept: 0. Let through by every file: **0**.
