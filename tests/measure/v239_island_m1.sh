S=/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/42502e7b-2053-4a9f-967f-bc24767d4547/scratchpad/measure
R=/Users/CanasBangin/Desktop/TheBig6V2
A=$R/app
echo ===PREP_PBX; grep -n "pbxproj\|IPHONEOS_DEPLOYMENT_TARGET\|deployment-target\|PRODUCT_BUNDLE_IDENTIFIER\|SWIFT_VERSION\|xcode.project\|writeSync" $A/node_modules/cordova-ios/lib/prepare.js | head -30
echo ===HOOKDIR; ls $A/node_modules/cordova-lib/src/hooks 2>&1 | head
echo ===PLATFORM_IGNORE; cat $A/platforms/ios/.gitignore
echo ===APPDIR; ls $A/platforms/ios/App
echo ===ENT; cat $A/platforms/ios/App/Entitlements-Debug.plist 2>/dev/null | grep -v "^<?xml\|DOCTYPE"
echo ===INFOKEYS; grep -c "<key>" $A/platforms/ios/App/App-Info.plist; grep -n "Live\|Background" $A/platforms/ios/App/App-Info.plist
cd $R
git ls-files --others --exclude-standard app | sort > $S/tracked_list.txt
echo ===WOULDCOMMIT; wc -l < $S/tracked_list.txt; sed 's#/[^/]*$##' $S/tracked_list.txt | sort | uniq -c
echo ===SIZE; tr '\n' '\0' < $S/tracked_list.txt | xargs -0 stat -f %z | awk '{s+=$1} END {print s" bytes"}'
echo ===BIG; tr '\n' '\0' < $S/tracked_list.txt | xargs -0 stat -f '%z %N' | sort -n -r | head -6
echo ===SECRETHITS; tr '\n' '\0' < $S/tracked_list.txt | xargs -0 grep -l -i -E "access_key|apikey|api_key|secret|password|BEGIN (RSA|PRIVATE|CERT)|teamID|DEVELOPMENT_TEAM *=" 2>/dev/null
echo ---; grep -n -i -E "access_key|secret|DEVELOPMENT_TEAM" $(cat $S/tracked_list.txt) 2>/dev/null | cut -c1-180 | head -10
echo ---EXT; grep -E "\.(p12|cer|mobileprovision|pem|key|keystore)$|build\.json$|\.env" $S/tracked_list.txt
echo ===IGNORED_PRESENT; ls $A/build.json 2>&1; du -sh $A/node_modules $A/www $A/platforms $A/.angular $A/public/legacy 2>/dev/null
echo ===DI; ls /Library/Developer/CoreSimulator/Profiles/DeviceTypes 2>&1 | head -3
for f in "/Library/Developer/CoreSimulator/Profiles/DeviceTypes/"iPhone*17*.simdevicetype "/Library/Developer/CoreSimulator/Profiles/DeviceTypes/iPhone Air.simdevicetype"; do echo "$f"; plutil -p "$f/Contents/Resources/profile.plist" 2>/dev/null | grep -i -E "sensor|island|cutout|notch|housing|chrome" | head -4; done
