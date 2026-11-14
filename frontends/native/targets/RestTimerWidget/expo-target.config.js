// The Expo app's widget target (MIGRATION.md phase 2, the native spike; 4.1). @bacons/apple-targets reads this on
// every expo prebuild and adds the target to the generated project, so ios/ stays generated and is never committed.
// Empty today: it proves a second signed target builds, signs and uploads. Phase 4 moves the rest stopwatch's Swift
// in. Its name and bundle id (com.bigyerr.ironasylum.next.RestTimerWidget) are the ones phase 4 keeps, so the App ID
// and the profile Mario makes for it are made once. No entitlements: an app group would need its own capability.
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'RestTimerWidget',
  bundleIdentifier: '.RestTimerWidget',
  deploymentTarget: '16.4',
  entitlements: {},
};
