import { iaStore } from './storage.ts';
import { showToast } from './rest-day-shell.ts';
import {
  backupProgramCount, loadBackupInto, readBackupText, takeBackup,
} from '../../../../../../core/src/engine/state-backup.ts';
import { IA_VERSION } from './update-check.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// D264 (data backup): every key the app stores starts ia_, and it all lives in this one address's browser storage, so
// a new phone, the move from the web app to the native app, or a deleted app starts empty. A backup is one JSON file
// holding every ia_ key exactly as stored; loading one replaces this phone's ia_ keys and reloads, so the app boots on
// it as it would on its own. Nothing is sent anywhere: the file goes only where the athlete shares it.
// The Bugs page draws the "Your data" block (screens-late.html here, the bug report component in the Angular app);
// both call the functions below. The file's snapshot, its reader and its loader live in core
// (core/src/engine/state-backup.ts, v0.261.8); the page hands them its store, its release and the clock.
import type { BackupData, BackupRead } from '../../../../../../core/src/engine/state-backup.ts';

function backupSnapshot(){return takeBackup(iaStore,String(IA_VERSION),Date.now());}
// The phone's local date, so a backup made late at night carries the day the athlete saw.
function backupFileName(at?: Date){
  const t=at||new Date();const p=(n: number)=>String(n).padStart(2,'0');
  return 'asylum-backup-'+t.getFullYear()+'-'+p(t.getMonth()+1)+'-'+p(t.getDate())+'.json';
}
// Checks a file's text and touches nothing. A newer format is told apart, so the athlete knows to update the app.
function readBackup(text: string): BackupRead{return readBackupText(text);}
function backupMessage(r: BackupRead){
  if(!r.ok) return r.why==='newer'?'This backup is from a newer app. Update the app first.':'That file is not an Asylum backup.';
  const d=new Date(r.made);
  const from=r.made&&!isNaN(d.getTime())?'Backup from '+d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+'. ':'';
  return from+r.programs+(r.programs===1?' program':' programs')+'. Loading it replaces everything on this phone.';
}
// Replaces every ia_ key with the file's. A refused write (storage full) puts back what the phone held, so a load is
// all or nothing. Keys that do not start ia_ are not the app's and stay.
function loadBackupData(data: BackupData): boolean{return loadBackupInto(iaStore,data);}
function applyBackup(data: BackupData): boolean{
  if(!loadBackupData(data)){showToast('Loading failed. Nothing changed.');return false;}
  location.reload();
  return true;
}
// Native app: the plugin's share sheet (the web view cannot save a file). Web app: the share sheet when it takes a
// file, else a download. The share sheet is its own confirmation, and a cancel is silent.
function saveBackup(): string{
  const snap=backupSnapshot();
  if(backupProgramCount(snap.data['ia_programs'])<1){showToast('Nothing to back up yet.');return 'empty';}
  const name=backupFileName(),text=JSON.stringify(snap);
  const fail=()=>showToast('Backup failed. Try again.');
  const island=(window as any).iaIsland;
  if(island&&typeof island.share==='function'){island.share(name,text,()=>{},fail);return 'native';}
  let file: File|null=null;
  try{file=new File([text],name,{type:'application/json'});}catch{file=null;}
  if(file&&navigator.canShare&&navigator.share&&navigator.canShare({files:[file]})){
    navigator.share({files:[file]}).catch((e: any)=>{if(!e||e.name!=='AbortError') fail();});
    return 'share';
  }
  try{
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('Backup saved.');
    return 'download';
  }catch{fail();return 'failed';}
}
function readBackupFile(file: Blob): Promise<BackupRead>{
  const text: Promise<string>=typeof file.text==='function'?file.text():new Promise((ok,no)=>{
    const r=new FileReader();r.onload=()=>ok(String(r.result||''));r.onerror=()=>no(r.error);r.readAsText(file);
  });
  return text.then(readBackup,()=>({ok:false,why:'bad'} as BackupRead));
}

// The legacy page's block (#backupMsg, #backupAsk, #backupFile in screens-late.html).
let _backupPending: BackupData|null=null;
function _backupShow(msg: string,ask: boolean){
  const m=document.getElementById('backupMsg'),a=document.getElementById('backupAsk');
  if(m) m.textContent=msg;
  if(a) a.style.display=ask?'flex':'none';
}
function backupPick(){
  const i=document.getElementById('backupFile') as HTMLInputElement|null;
  if(i){i.value='';i.click();}
}
function backupFileChosen(input: HTMLInputElement){
  const f=input&&input.files&&input.files[0];
  if(!f) return;
  readBackupFile(f).then(r=>{_backupPending=r.ok?r.data:null;_backupShow(backupMessage(r),r.ok);});
}
function backupLoadIt(){
  if(_backupPending&&applyBackup(_backupPending)) return;
  backupCancel();
}
function backupCancel(){_backupPending=null;_backupShow('',false);}
