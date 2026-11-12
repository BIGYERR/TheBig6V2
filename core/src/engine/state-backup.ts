// ── The backup: one file holding every ia_ key as stored (D264, docs/decisions/data-backup.md; docs/decisions/stored-state.md). ──
// Moved out of the page's data-backup.ts in v0.261.8, code as it was, with the store, the release and the instant passed
// in where the page read its globals and the clock. What saves the file (the share sheet, the download), what reads the
// picked file's text, the line the Bugs page shows and the block that draws it stay in the page. It lives beside the
// engine while the page is built from this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';

const BACKUP_KIND='asylum-backup';
const BACKUP_FORMAT=1;   // the file's shape, a counter of its own; never a release version
export type BackupData=Record<string,string>;
export type BackupRead={ok:true,data:BackupData,programs:number,made:string}|{ok:false,why:'bad'|'newer'};
/** A backup file as written: its kind, its format, the release that wrote it, the instant, and every ia_ key. */
export interface BackupFile {kind:string;format:number;version:string;made:string;data:BackupData}

// Every key the app stores starts ia_; the rest are not the app's and are never backed up or replaced. Sorted, so a
// file lists its keys the same way whatever order the phone's storage keeps them in.
function backupKeys(store: StateStore): string[]{
  const keys: string[]=[];
  store.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});
  return keys.sort();
}
// The file's contents: every ia_ key exactly as stored, the release that wrote it and the instant it was made.
function takeBackup(store: StateStore, version: string, now: number): BackupFile{
  const data: BackupData={};
  backupKeys(store).forEach(k=>{const v=store.get(k);if(v!=null) data[k]=v;});
  return {kind:BACKUP_KIND,format:BACKUP_FORMAT,version,made:new Date(now).toISOString(),data};
}
// How many programs a stored program list holds; -1 when there is none, or it is not a list.
function backupProgramCount(raw: string|undefined): number{
  if(raw==null) return -1;
  try{const a=JSON.parse(raw);return Array.isArray(a)?a.length:-1;}catch{return -1;}
}
// Checks a file's text and touches nothing. A newer format is told apart, so the athlete knows to update the app.
function readBackupText(text: string): BackupRead{
  let f: any;
  try{f=JSON.parse(text);}catch{return {ok:false,why:'bad'};}
  if(!f||typeof f!=='object'||f.kind!==BACKUP_KIND) return {ok:false,why:'bad'};
  if(typeof f.format==='number'&&f.format>BACKUP_FORMAT) return {ok:false,why:'newer'};
  if(f.format!==BACKUP_FORMAT) return {ok:false,why:'bad'};
  const d=f.data;
  if(!d||typeof d!=='object'||Array.isArray(d)) return {ok:false,why:'bad'};
  if(!Object.keys(d).every(k=>k.indexOf('ia_')===0&&typeof d[k]==='string')) return {ok:false,why:'bad'};
  const programs=backupProgramCount(d.ia_programs);
  if(programs<0) return {ok:false,why:'bad'};
  return {ok:true,data:d,programs,made:typeof f.made==='string'?f.made:''};
}
// Replaces every ia_ key with the file's. A refused write (storage full) puts back what the phone held, so a load is
// all or nothing. Keys that do not start ia_ are not the app's and stay.
function loadBackupInto(store: StateStore, data: BackupData): boolean{
  const before: BackupData={};
  const keys=backupKeys(store);
  keys.forEach(k=>{const v=store.get(k);if(v!=null) before[k]=v;});
  try{
    keys.forEach(k=>store.remove(k));
    Object.keys(data).forEach(k=>store.set(k,data[k]!));
    return true;
  }catch{
    backupKeys(store).forEach(k=>{try{store.remove(k);}catch{}});
    Object.keys(before).forEach(k=>{try{store.set(k,before[k]!);}catch{}});
    return false;
  }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { BACKUP_FORMAT, BACKUP_KIND, backupKeys, backupProgramCount, loadBackupInto, readBackupText, takeBackup };
