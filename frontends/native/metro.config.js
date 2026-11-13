// Metro for the Expo app. Core (@ia/core, a file: dependency, so a link to ../../core) sits outside this folder, so
// Metro watches it. A package that a core file asks for (core imports none itself; Babel adds its runtime helpers)
// resolves from this app, never from a node_modules above core (the repo root holds Heroku's), so the engine is
// bundled with this app's Babel runtime. Everything else resolves as Metro does by default.
// Measured (tests/measure/engine-check_hermes.mjs): core bundles as it is, its .ts import paths included.
const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const CORE = fs.realpathSync(path.resolve(__dirname, '..', '..', 'core'));
const APP_ENTRY = path.join(__dirname, 'index.ts');

const config = getDefaultConfig(__dirname);
config.watchFolders = [CORE];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromCore = context.originModulePath.startsWith(CORE + path.sep);
  const bare = !moduleName.startsWith('.') && !path.isAbsolute(moduleName);
  if (fromCore && bare) return context.resolveRequest({ ...context, originModulePath: APP_ENTRY }, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
