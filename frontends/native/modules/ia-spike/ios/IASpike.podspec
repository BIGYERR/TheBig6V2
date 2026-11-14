# The Expo app's first local Swift module (MIGRATION.md phase 2, the native spike). Expo's autolinking finds it under
# modules/ on every expo prebuild and CocoaPods builds it into the app; nothing of it lives in the generated ios/.
Pod::Spec.new do |s|
  s.name           = 'IASpike'
  s.version        = '1.0.0'
  s.summary        = 'A Swift module that does nothing and answers once.'
  s.description    = 'Proves a local Swift module is built into the Expo app and answers a call from JavaScript.'
  s.author         = 'Iron Asylum'
  s.homepage       = 'https://bigyerr.github.io/TheBig6V2/'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
