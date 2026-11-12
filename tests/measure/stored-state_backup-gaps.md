# Stored state: the backup's rules, are the records blind to them? (on 0.261.7)

Written by `tests/measure/stored-state_backup-gaps-breaks.mjs`. 21 breaks and the control; 15 green on the records (the control must be red).

| Break | What it does | The records | The backup's own tests |
|---|---|---|---|
| log key (control) | a log is stored under w1-mon | red (the fast file) | green |
| backup scan | the backup leaves out the last key | red (the fast file) | red |
| backup scan, prefix | the backup takes every key, not only the app's | GREEN (blind) | red |
| backup order | the backup keeps storage order | GREEN (blind) | red |
| snapshot null | a key with no value goes into the file | GREEN (blind) | green |
| snapshot kind | the file is not marked as a backup | red (the fast file) | red |
| snapshot format | the file carries no format | red (the fast file) | red |
| snapshot version | the file does not name its release | red (the fast file) | red |
| snapshot made | the file does not carry when it was made | red (the fast file) | red |
| reader kind | a file of another kind is read | GREEN (blind) | red |
| reader newer | a newer file reads as not a backup | GREEN (blind) | red |
| reader format | a file with no format is read | GREEN (blind) | red |
| reader data | a file whose data is not an object is read | GREEN (blind) | red |
| reader keys | a file with a key not the app's, or a value not a string, is read | GREEN (blind) | red |
| reader programs | a file with no program list is read | GREEN (blind) | red |
| program count | every program list counts one | GREEN (blind) | red |
| reader made | the file's time is not read | GREEN (blind) | red |
| load clears | a load keeps the phone's keys the file does not hold | GREEN (blind) | red |
| load writes | a load writes nothing | red (the fast file) | red |
| load rollback, clear | a refused load keeps what it wrote | GREEN (blind) | green |
| load rollback, restore | a refused load does not put back what the phone held | GREEN (blind) | red |
| load result | a refused load reports success | GREEN (blind) | red |
