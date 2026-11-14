// The Backup row of the Expo app (D287 P-NATIVEIMPORT, docs/decisions/data-backup.md): load a backup file, read
// only, into this app's own SQLite store, and show what the store holds: each ia_ key, its size and its sha256, and
// the program core's readers find. The picker copies the file into this app's cache before it is read, so the file
// itself is never opened for writing; nothing here writes a file or reaches today's app.
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getDocumentAsync } from 'expo-document-picker';
import { File } from 'expo-file-system';

import { held, importBackup, importLine } from './store/backup-import';
import type { Held } from './store/backup-import';
import { phoneStore } from './store/phone-store';
import type { Palette } from './theme';

function heldLine(h: Held): string {
  if (!h.keys.length) return 'Holds nothing yet.';
  return 'Holds ' + h.keys.length + (h.keys.length === 1 ? ' key.' : ' keys.');
}

function programLine(p: Held['programs'][number]): string {
  return (p.name || p.id) + '. ' + p.totalWeeks + ' weeks' + (p.startDate ? ' from ' + p.startDate : '') + '. ' +
    (p.active ? 'Active. ' : '') + p.marked + (p.marked === 1 ? ' day marked.' : ' days marked.');
}

export function BackupLoad({ palette: p }: { palette: Palette }) {
  const [state, setState] = useState<Held>(() => held(phoneStore));
  const [line, setLine] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await getDocumentAsync({ type: ['application/json', 'public.json', '*/*'], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets[0]) return;
      const text = await new File(picked.assets[0].uri).text();
      const r = importBackup(phoneStore, text);
      setLine(importLine(r));
      setState(held(phoneStore));
    } catch {
      setLine('That file could not be read. Nothing was kept.');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
      <Text style={[styles.label, { color: p.text }]}>Backup</Text>
      <Text style={[styles.note, { color: p.muted }]}>Loads a backup file into this app and checks every key. Writes nothing back.</Text>
      <Pressable testID="backup-load" accessibilityRole="button" onPress={load} disabled={busy}
        style={[styles.button, { backgroundColor: p.accent, opacity: busy ? 0.6 : 1 }]}>
        <Text style={[styles.buttonText, { color: p.onInk }]}>{busy ? 'Checking' : 'Load a backup'}</Text>
      </Pressable>
      {line ? <Text testID="backup-line" style={[styles.line, { color: p.text }]}>{line}</Text> : null}
      <Text testID="backup-held" style={[styles.line, { color: p.text }]}>{heldLine(state)}</Text>
      {state.programs.map((g) => (
        <Text key={g.id} testID={'backup-program-' + g.id} style={[styles.line, { color: p.text }]}>{programLine(g)}</Text>
      ))}
      {state.keys.map((k) => (
        <View key={k.key} testID={'backup-key-' + k.key} style={[styles.key, { borderColor: p.border }]}>
          <Text style={[styles.keyName, { color: p.text }]}>{k.key + '  ' + k.bytes.toLocaleString('en-US') + ' bytes'}</Text>
          <Text selectable style={[styles.hash, { color: p.muted }]}>{k.sha256}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 16 },
  label: { fontSize: 17, fontWeight: '700' },
  note: { fontSize: 14, marginTop: 4, marginBottom: 12 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  line: { fontSize: 14, marginTop: 10 },
  key: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 8 },
  keyName: { fontSize: 13, fontWeight: '600' },
  hash: { fontSize: 11, fontFamily: 'Menlo', marginTop: 2 },
});
