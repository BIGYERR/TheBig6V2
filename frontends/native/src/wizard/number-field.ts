// A number field's own sums in the Expo app (MIGRATION.md phase 3, row 6, the second of two sessions). Today's
// wizard asks WebKit for each of its numbers (<input type="number">). The field keeps a text of its own, takes or
// drops each key typed, and hands the page a value made from that text. React Native has no such field, so the
// wizard's fields are text fields that follow what WebKit's was seen to do.
//
// Seen in the simulator's Safari (iOS 26.5) on fields set as the wizard sets its own, 45 texts typed key by key
// (tests/measure/native-wizard_cardio-goals.md, section J):
//
//   a digit is always kept;
//   a point is kept while the text holds no point and no e;
//   e or E is kept while the text holds none;
//   a minus or a plus is kept at the start of the text, or right after the e;
//   nothing else is kept (a letter, a comma, a space, a slash, a colon);
//   a key that is not kept still fires the field's handler, with the value as it stood.
//
// The value handed back is the text when it is a whole number as written, less a plus at its start and a point at
// its very end, and blank otherwise ("1." hands back "1", "+5" hands back "5", "1e" and "-" hand back nothing).
// Leading zeros and a zero after the point are handed back as typed. The field's min, max and step change none of it.

/** A text the field can hold: every text reached by keys the field keeps. */
const KEPT = /^[+-]?\d*(\.\d*)?([eE][+-]?\d*)?$/;
/** A text that is a whole number as written: digits, a point with or without digits after it, an exponent with its digits. */
const WHOLE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/** The field's text after an edit: the new text when the field can hold it, else the text as it stood. */
export function keptText(prev: string, next: string): string {
  return KEPT.test(next) ? next : prev;
}

/** The value the field hands its handler for a text. */
export function fieldValue(text: string): string {
  return WHOLE.test(text) ? text.replace(/^\+/, '').replace(/\.$/, '') : '';
}
