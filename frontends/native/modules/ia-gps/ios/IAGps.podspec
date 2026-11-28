# The Expo app's GPS recorder (MIGRATION.md phase 4): today's ia-gps Cordova plugin as a local Swift module. Expo's
# autolinking finds it under modules/ on every expo prebuild and CocoaPods builds it into the app; nothing of it lives
# in the generated ios/. Its permission strings and its background mode are the app's Info.plist lines (app.config.js).
Pod::Spec.new do |s|
  s.name           = 'IAGps'
  s.version        = '1.0.0'
  s.summary        = 'GPS run recorder for the Expo app.'
  s.description    = 'Records a run by GPS, the step counter and the barometer, one raw file a run, for the Run recorder.'
  s.author         = 'Iron Asylum'
  s.homepage       = 'https://bigyerr.github.io/TheBig6V2/'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreLocation', 'CoreMotion'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
