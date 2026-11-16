// native-deck-popups: lets node run a measure script that imports the Expo app's files, whose imports carry no
// extension (Metro and Vitest resolve them; node does not). Loaded with --import by the two scripts of this name.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const u = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(u))) return next(specifier + ext, context);
      }
    }
    return next(specifier, context);
  },
});
