#!/usr/bin/env node
/*
 * after_prepare (ios), declared in plugin.xml. Adds the RestTimerWidget app extension that draws the rest stopwatch
 * Live Activity (V239 D233 P-ISLAND), and puts it right again on every prepare.
 *
 * platforms/ is regenerated on demand, so the target cannot be added by hand in Xcode; this hook adds it with the
 * node-xcode package cordova-ios ships. Every step is an "ensure": a second run finds everything in place and leaves
 * project.pbxproj byte for byte as it was, and the project never holds more than one RestTimerWidget target.
 *
 * The extension:
 *   - compiles src/ios/widget/RestTimerWidget.swift (copied to platforms/ios/RestTimerWidget/) and the plugin's
 *     RestTimerAttributes.swift, the same file reference the App target compiles;
 *   - links WidgetKit and SwiftUI (ActivityKit is autolinked by its import);
 *   - IPHONEOS_DEPLOYMENT_TARGET 16.2 on its own configurations only; the App target keeps the project's 13.0;
 *   - is embedded into the app's PlugIns, with a target dependency so building App builds it first.
 *
 * Cordova's prepare writes IPHONEOS_DEPLOYMENT_TARGET, SWIFT_VERSION and TARGETED_DEVICE_FAMILY with no target named
 * (into every configuration, this one included) when config.xml sets the matching preference. This hook runs after
 * that write and sets the extension's values again, and its log line says what it found.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TARGET = 'RestTimerWidget';
const PRODUCT = `${TARGET}.appex`;
const DEPLOYMENT_TARGET = '16.2';
const WIDGET_SOURCE = 'RestTimerWidget.swift';
const WIDGET_PLIST = 'Info.plist';
const SHARED_SOURCE = 'RestTimerAttributes.swift';
const FRAMEWORKS = ['WidgetKit.framework', 'SwiftUI.framework'];
const EMBED_PHASE = 'Embed App Extensions';
const PLUGINS_FOLDER = 13; // PBXCopyFilesBuildPhase dstSubfolderSpec for the bundle's PlugIns

module.exports = function addWidgetTarget (context) {
    const projectRoot = context.opts.projectRoot;
    const platforms = (context.opts.platforms || []).map((p) => String(p).split('@')[0]);
    if (platforms.length && !platforms.includes('ios')) return;
    const iosRoot = path.join(projectRoot, 'platforms', 'ios');
    const pbxPath = path.join(iosRoot, 'App.xcodeproj', 'project.pbxproj');
    if (!fs.existsSync(pbxPath)) return;

    const copied = copyWidgetFiles(path.join(__dirname, '..', 'src', 'ios', 'widget'), path.join(iosRoot, TARGET));

    const xcodePath = require.resolve('xcode', {
        paths: [path.join(projectRoot, 'node_modules', 'cordova-ios'), projectRoot, __dirname]
    });
    const project = require(xcodePath).project(pbxPath);
    project.parseSync();
    const report = ensureWidget(new Pbx(project), appBundleId(projectRoot));

    const before = fs.readFileSync(pbxPath, 'utf8');
    const after = project.writeSync();
    if (after !== before) fs.writeFileSync(pbxPath, after);
    console.log(`ia-island: ${TARGET} ${report}; widget files ${copied ? 'copied' : 'unchanged'}; ` +
        `project.pbxproj ${after !== before ? 'written' : 'unchanged'}`);
};

/** Copies the extension's own files into platforms/ios/RestTimerWidget/ when they differ. */
function copyWidgetFiles (srcDir, destDir) {
    let copied = false;
    fs.mkdirSync(destDir, { recursive: true });
    for (const name of [WIDGET_SOURCE, WIDGET_PLIST]) {
        const src = path.join(srcDir, name);
        const dest = path.join(destDir, name);
        if (!fs.existsSync(src)) throw new Error(`ia-island: ${src} is missing`);
        const data = fs.readFileSync(src);
        if (fs.existsSync(dest) && data.equals(fs.readFileSync(dest))) continue;
        fs.writeFileSync(dest, data);
        copied = true;
    }
    return copied;
}

/** The app's bundle id, as prepare reads it: ios-CFBundleIdentifier, else the widget id. */
function appBundleId (projectRoot) {
    const xml = fs.readFileSync(path.join(projectRoot, 'config.xml'), 'utf8');
    const widget = (xml.match(/<widget\b[^>]*>/) || [''])[0];
    const id = (widget.match(/\sios-CFBundleIdentifier="([^"]+)"/) || widget.match(/\sid="([^"]+)"/) || [])[1];
    if (!id) throw new Error('ia-island: config.xml has no widget id');
    return id;
}

const unquote = (v) => (typeof v === 'string' ? v.replace(/^"(.*)"$/, '$1') : v);
const quote = (v) => `"${v}"`;

/** A thin view of the parsed pbxproj objects. */
class Pbx {
    constructor (project) {
        this.project = project;
        this.objects = project.hash.project.objects;
        this.rootUuid = project.hash.project.rootObject;
    }

    section (isa) {
        this.objects[isa] = this.objects[isa] || {};
        return this.objects[isa];
    }

    entries (isa) {
        return Object.entries(this.section(isa)).filter(([key]) => !key.endsWith('_comment'));
    }

    get (isa, uuid) {
        return this.section(isa)[uuid];
    }

    put (isa, object, comment) {
        const uuid = this.project.generateUuid();
        this.section(isa)[uuid] = object;
        this.section(isa)[`${uuid}_comment`] = comment;
        return uuid;
    }

    remove (isa, uuid) {
        delete this.section(isa)[uuid];
        delete this.section(isa)[`${uuid}_comment`];
    }

    get root () {
        return this.get('PBXProject', this.rootUuid);
    }

    targets (name) {
        return this.entries('PBXNativeTarget').filter(([, t]) => unquote(t.name) === name);
    }

    configs (target) {
        const list = this.get('XCConfigurationList', target.buildConfigurationList);
        return list.buildConfigurations.map((ref) => this.get('XCBuildConfiguration', ref.value));
    }

    /** The target's build phase of this isa, created and appended when missing. */
    phase (target, isa, comment) {
        const ref = target.buildPhases.find((p) => this.get(isa, p.value));
        if (ref) return this.get(isa, ref.value);
        const uuid = this.put(isa, {
            isa, buildActionMask: 2147483647, files: [], runOnlyForDeploymentPostprocessing: 0
        }, comment);
        target.buildPhases.push({ value: uuid, comment });
        return this.get(isa, uuid);
    }

    /**
     * Makes a phase hold exactly one build file for each wanted file reference. `exclusive` also drops entries for
     * any other reference; either way it drops entries whose build file or file reference is gone (cordova's plugin
     * uninstall deletes build files by name, the extension's included).
     */
    syncPhase (phase, wanted, phaseName, { exclusive = true, settings } = {}) {
        const buildFiles = this.section('PBXBuildFile');
        const refs = new Set(wanted.map(([ref]) => ref));
        const seen = new Set();
        phase.files = phase.files.filter((entry) => {
            const bf = buildFiles[entry.value];
            const keep = bf && this.get('PBXFileReference', bf.fileRef) &&
                (!exclusive || refs.has(bf.fileRef)) && !(refs.has(bf.fileRef) && seen.has(bf.fileRef));
            if (bf && keep) seen.add(bf.fileRef);
            if (bf && !keep) this.remove('PBXBuildFile', entry.value);
            return keep;
        });
        for (const [ref, name] of wanted) {
            if (seen.has(ref)) continue;
            const comment = `${name} in ${phaseName}`;
            const object = { isa: 'PBXBuildFile', fileRef: ref, fileRef_comment: name };
            if (settings) object.settings = settings;
            phase.files.push({ value: this.put('PBXBuildFile', object, comment), comment });
        }
    }
}

function ensureWidget (pbx, appId) {
    const apps = pbx.targets('App');
    if (apps.length !== 1) throw new Error(`ia-island: expected 1 App target, found ${apps.length}`);
    const app = apps[0][1];
    const found = pbx.targets(TARGET);
    if (found.length > 1) throw new Error(`ia-island: ${found.length} ${TARGET} targets; expected at most 1`);

    const created = found.length === 0;
    const [targetUuid, target] = created ? createTarget(pbx) : found[0];

    const swiftRef = ensureWidgetGroup(pbx);
    pbx.syncPhase(pbx.phase(target, 'PBXSourcesBuildPhase', 'Sources'),
        [[swiftRef, WIDGET_SOURCE], [sharedSourceRef(pbx, app), SHARED_SOURCE]], 'Sources');
    pbx.syncPhase(pbx.phase(target, 'PBXFrameworksBuildPhase', 'Frameworks'),
        FRAMEWORKS.map((name) => [frameworkRef(pbx, name), name]), 'Frameworks');
    pbx.phase(target, 'PBXResourcesBuildPhase', 'Resources');
    const deploymentBefore = ensureSettings(pbx, target, app, appId);
    ensureEmbed(pbx, app, target.productReference);
    ensureDependency(pbx, app, targetUuid);

    return created
        ? `target created (IPHONEOS_DEPLOYMENT_TARGET ${DEPLOYMENT_TARGET})`
        : `target present (IPHONEOS_DEPLOYMENT_TARGET found ${deploymentBefore}, set ${DEPLOYMENT_TARGET})`;
}

function createTarget (pbx) {
    const root = pbx.root;
    const productRef = pbx.put('PBXFileReference', {
        isa: 'PBXFileReference', explicitFileType: quote('wrapper.app-extension'), includeInIndex: 0,
        path: PRODUCT, sourceTree: 'BUILT_PRODUCTS_DIR'
    }, PRODUCT);
    pbx.get('PBXGroup', root.productRefGroup).children.push({ value: productRef, comment: PRODUCT });

    const configs = ['Debug', 'Release'].map((name) => ({
        value: pbx.put('XCBuildConfiguration', { isa: 'XCBuildConfiguration', buildSettings: {}, name }, name),
        comment: name
    }));
    const listComment = `Build configuration list for PBXNativeTarget "${TARGET}"`;
    const list = pbx.put('XCConfigurationList', {
        isa: 'XCConfigurationList', buildConfigurations: configs,
        defaultConfigurationIsVisible: 0, defaultConfigurationName: 'Release'
    }, listComment);

    const target = {
        isa: 'PBXNativeTarget',
        buildConfigurationList: list,
        buildConfigurationList_comment: listComment,
        buildPhases: [],
        buildRules: [],
        dependencies: [],
        name: TARGET,
        productName: TARGET,
        productReference: productRef,
        productReference_comment: PRODUCT,
        productType: quote('com.apple.product-type.app-extension')
    };
    const uuid = pbx.put('PBXNativeTarget', target, TARGET);
    root.targets.push({ value: uuid, comment: TARGET });
    root.attributes.TargetAttributes = root.attributes.TargetAttributes || {};
    root.attributes.TargetAttributes[uuid] = { CreatedOnToolsVersion: '26.0' };
    return [uuid, target];
}

/** The RestTimerWidget group (path RestTimerWidget/) with its two files; returns the Swift file's reference. */
function ensureWidgetGroup (pbx) {
    const main = pbx.get('PBXGroup', pbx.root.mainGroup);
    let groupRef = main.children.find((c) => unquote((pbx.get('PBXGroup', c.value) || {}).path) === TARGET);
    if (!groupRef) {
        const uuid = pbx.put('PBXGroup', { isa: 'PBXGroup', children: [], path: TARGET, sourceTree: quote('<group>') }, TARGET);
        groupRef = { value: uuid, comment: TARGET };
        main.children.push(groupRef);
    }
    const group = pbx.get('PBXGroup', groupRef.value);
    const fileIn = (name, type) => {
        const child = group.children.find((c) => unquote((pbx.get('PBXFileReference', c.value) || {}).path) === name);
        if (child) return child.value;
        const uuid = pbx.put('PBXFileReference', {
            isa: 'PBXFileReference', lastKnownFileType: type, path: name, sourceTree: quote('<group>')
        }, name);
        group.children.push({ value: uuid, comment: name });
        return uuid;
    };
    fileIn(WIDGET_PLIST, 'text.plist.xml');
    return fileIn(WIDGET_SOURCE, 'sourcecode.swift');
}

/** The file reference of the plugin's RestTimerAttributes.swift that the App target compiles. */
function sharedSourceRef (pbx, app) {
    const appSources = pbx.phase(app, 'PBXSourcesBuildPhase', 'Sources');
    const buildFiles = pbx.section('PBXBuildFile');
    const refs = appSources.files
        .map((entry) => (buildFiles[entry.value] || {}).fileRef)
        .filter((ref) => ref && path.basename(unquote((pbx.get('PBXFileReference', ref) || {}).path || '')) === SHARED_SOURCE);
    if (refs.length !== 1) {
        throw new Error(`ia-island: the App target compiles ${refs.length} ${SHARED_SOURCE}; expected 1 (reinstall the plugin)`);
    }
    return refs[0];
}

/** An SDK framework reference, created in the Frameworks group when missing. */
function frameworkRef (pbx, name) {
    const sdkPath = `System/Library/Frameworks/${name}`;
    const found = pbx.entries('PBXFileReference').find(([, f]) => unquote(f.path) === sdkPath);
    if (found) return found[0];
    const uuid = pbx.put('PBXFileReference', {
        isa: 'PBXFileReference', lastKnownFileType: 'wrapper.framework', name, path: sdkPath, sourceTree: 'SDKROOT'
    }, name);
    const main = pbx.get('PBXGroup', pbx.root.mainGroup);
    const frameworksRef = main.children.find((c) => unquote((pbx.get('PBXGroup', c.value) || {}).name) === 'Frameworks');
    (frameworksRef ? pbx.get('PBXGroup', frameworksRef.value) : main).children.push({ value: uuid, comment: name });
    return uuid;
}

/** The extension's build settings, set on every run. Returns the deployment target(s) found before setting. */
function ensureSettings (pbx, target, app, appId) {
    const appConfig = pbx.configs(app).find((c) => unquote(c.name) === 'Debug') || pbx.configs(app)[0];
    const marketing = appConfig.buildSettings.MARKETING_VERSION;
    const build = appConfig.buildSettings.CURRENT_PROJECT_VERSION;
    if (marketing === undefined || build === undefined) {
        throw new Error('ia-island: the App target has no MARKETING_VERSION or CURRENT_PROJECT_VERSION');
    }
    const settings = {
        APPLICATION_EXTENSION_API_ONLY: 'YES',
        CODE_SIGN_STYLE: 'Automatic',
        CURRENT_PROJECT_VERSION: build,
        GENERATE_INFOPLIST_FILE: 'NO',
        INFOPLIST_FILE: quote(`${TARGET}/${WIDGET_PLIST}`),
        IPHONEOS_DEPLOYMENT_TARGET: DEPLOYMENT_TARGET,
        LD_RUNPATH_SEARCH_PATHS: [quote('$(inherited)'), quote('@executable_path/Frameworks'),
            quote('@executable_path/../../Frameworks')],
        MARKETING_VERSION: marketing,
        PRODUCT_BUNDLE_IDENTIFIER: quote(`${appId}.${TARGET}`),
        PRODUCT_NAME: quote('$(TARGET_NAME)'),
        SKIP_INSTALL: 'YES',
        SWIFT_VERSION: '5.0',
        TARGETED_DEVICE_FAMILY: '1'
    };
    const found = new Set();
    for (const config of pbx.configs(target)) {
        found.add(String(unquote(config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET) ?? 'unset'));
        Object.assign(config.buildSettings, settings);
    }
    return [...found].join(', ');
}

/** The app's Embed App Extensions phase (PlugIns) holding the extension's product. */
function ensureEmbed (pbx, app, productRef) {
    let phase = app.buildPhases
        .map((p) => pbx.get('PBXCopyFilesBuildPhase', p.value))
        .find((p) => p && Number(p.dstSubfolderSpec) === PLUGINS_FOLDER);
    if (!phase) {
        const uuid = pbx.put('PBXCopyFilesBuildPhase', {
            isa: 'PBXCopyFilesBuildPhase', buildActionMask: 2147483647, dstPath: '""',
            dstSubfolderSpec: PLUGINS_FOLDER, files: [], name: quote(EMBED_PHASE), runOnlyForDeploymentPostprocessing: 0
        }, EMBED_PHASE);
        app.buildPhases.push({ value: uuid, comment: EMBED_PHASE });
        phase = pbx.get('PBXCopyFilesBuildPhase', uuid);
    }
    pbx.syncPhase(phase, [[productRef, PRODUCT]], EMBED_PHASE,
        { exclusive: false, settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] } });
}

/** App depends on the extension, so building App builds it first. */
function ensureDependency (pbx, app, targetUuid) {
    app.dependencies = app.dependencies || [];
    const deps = pbx.section('PBXTargetDependency');
    if (app.dependencies.some((d) => deps[d.value] && deps[d.value].target === targetUuid)) return;
    const proxy = pbx.put('PBXContainerItemProxy', {
        isa: 'PBXContainerItemProxy', containerPortal: pbx.rootUuid, containerPortal_comment: 'Project object',
        proxyType: 1, remoteGlobalIDString: targetUuid, remoteInfo: TARGET
    }, 'PBXContainerItemProxy');
    const dep = pbx.put('PBXTargetDependency', {
        isa: 'PBXTargetDependency', target: targetUuid, target_comment: TARGET,
        targetProxy: proxy, targetProxy_comment: 'PBXContainerItemProxy'
    }, 'PBXTargetDependency');
    app.dependencies.push({ value: dep, comment: 'PBXTargetDependency' });
}
