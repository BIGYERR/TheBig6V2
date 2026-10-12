# Design tokens: decisions

The CSS custom properties the frontends draw with (docs/design/THE_ASYLUM_DS_REFERENCE.md). The tokens the website and
the admin share live in `frontends/common/tokens.css`, which each `styles.css` imports first; each keeps only its own
tokens beside it. Test: `tests/unit/design-tokens.test.ts`. The app's tokens (its legacy CSS in
`frontends/app/src/legacy/src/css/`) join when phase E builds its screens on `frontends/common/`.

## D237 P-SHAREDTOKENS: one value for every token both frontends use; the website's wins where they drifted

- **Date:** 2026-10-12. **Ruled by:** Mario ("yes use the website's tokens"). **Shipped:** Post-v0.239.1, no build (the
  website and the admin are not the app, so `ia-version` does not move).
- **Finding:** the folder layout's step 3 moved the 16 tokens both stylesheets declared with the same value into
  `frontends/common/tokens.css`. Four more shared a name but not a value: the text font stack (the website lists
  'Helvetica Now Text' before Arial), the mono font stack (the website puts 'Geist Mono' first), and the ink line and
  ink muted alphas (website 0.14 and 0.64, admin 0.16 and 0.66).
- **Changes:** the four take the website's values and move into `frontends/common/tokens.css`; neither stylesheet
  declares them any more. The admin's text and mono stacks gain 'Helvetica Now Text' and 'Geist Mono' (each used only
  where the font is available), and its lines and muted text on ink are 2 points more transparent.
- **Does not change:** the website (its built sheet holds the same 33 tokens with the same values and is otherwise byte
  for byte the same); everything in the admin's sheet besides those four values; the app.
- **Expected values:** `--ink-line: rgba(244, 241, 232, 0.14)`; `--ink-muted: rgba(244, 241, 232, 0.64)`;
  `--font-text: 'Helvetica Neue', Helvetica, 'Geist', 'Helvetica Now Text', Arial, sans-serif`;
  `--font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace`. No token is declared in both stylesheets,
  and neither redeclares a shared one.
- **Proof:** the test fails on the commit before the change in exactly its two tests for the ruled behaviour (the four
  values, and no token declared twice) and passes after; the two guards (the shared palette, the import first) pass on
  both. The built admin sheet differs from the one before only in the four values.
