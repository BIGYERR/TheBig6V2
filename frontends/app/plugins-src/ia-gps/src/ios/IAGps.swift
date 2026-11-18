// The native side of window.iaGps (D267 P-GPSTEST, docs/decisions/gps-recording.md): records a run by GPS for the Run
// recorder. Every fix iOS delivers is written raw, one JSON object a line, to Application Support/ia-gps/<id>.jsonl the
// moment it arrives, so a crash or iOS closing the app keeps the run up to that second. Every judgement (distance,
// splits, what counts) runs in the page, in core/src/gps; nothing here filters a fix.
// From D296 P-STEPCLIMB a run also records Core Motion's step counter ({t, steps, sd, cad}: steps since Start, its
// distance from steps in metres, its cadence in steps a second) and barometer ({t, ralt, kpa}: metres relative to its
// first reading, kilopascals), raw, beside the fixes. Without the sensors or the permission the run records by GPS alone.
//   listen  []      the one event channel, kept open: {type:"auth", status}, {type:"fix", fix, recorded},
//                   {type:"mark", line}, {type:"motion", line}, {type:"error", message}
//   warm    []      location on before Start, so the screen can show iOS's accuracy (asks permission when needed, and
//                   asks Motion & Fitness once, so the question never comes as the athlete starts)
//   cool    []      location off again, unless a run is recording
//   start   []      a new run: its file, the start mark, then every fix; waits for permission when it is not yet given
//   pause   []      the pause mark (location stays on, so the GPS stays warm and the app stays alive in the background)
//   resume  []      the resume mark
//   finish  []      the finish mark, the file closed; success carries the run's id
//   status  []      {recording, paused, id}
//   list    []      the runs on this phone, newest first: [{id, bytes}]
//   read    [id]    the run's file as text
//   remove  [id]    deletes the run's file (never the one recording)
// No network: the file leaves the phone only through the share sheet (window.iaIsland.share), when the athlete shares.

import CoreLocation
import CoreMotion
import Foundation
import UIKit
#if canImport(Cordova)
import Cordova
#endif

@objc(IAGps)
class IAGps: CDVPlugin, CLLocationManagerDelegate {
    private var manager: CLLocationManager?
    private var listener: String?
    private var warmed = false
    private var wantsStart = false
    private var runId: String?
    private var handle: FileHandle?
    private var paused = false
    private let pedometer = CMPedometer()
    private let altimeter = CMAltimeter()
    private var motionOn = false

    @objc(listen:)
    func listen(_ command: CDVInvokedUrlCommand) {
        listener = command.callbackId
        send(["type": "auth", "status": authName(authStatus())])
    }

    @objc(warm:)
    func warm(_ command: CDVInvokedUrlCommand) {
        warmed = true
        ensureUpdates()
        askMotion()
        ok(command)
    }

    @objc(cool:)
    func cool(_ command: CDVInvokedUrlCommand) {
        warmed = false
        if runId == nil { manager?.stopUpdatingLocation() }
        ok(command)
    }

    @objc(start:)
    func start(_ command: CDVInvokedUrlCommand) {
        if runId == nil {
            wantsStart = true
            ensureUpdates()
        }
        ok(command)
    }

    @objc(pause:)
    func pause(_ command: CDVInvokedUrlCommand) {
        if runId != nil && !paused {
            paused = true
            writeMark("pause")
        }
        ok(command)
    }

    @objc(resume:)
    func resume(_ command: CDVInvokedUrlCommand) {
        if runId != nil && paused {
            paused = false
            writeMark("resume")
        }
        ok(command)
    }

    @objc(finish:)
    func finish(_ command: CDVInvokedUrlCommand) {
        guard let id = runId else {
            fail(command, "no run is recording")
            return
        }
        writeMark("finish")
        stopMotion()
        closeFile()
        runId = nil
        paused = false
        manager?.allowsBackgroundLocationUpdates = false
        if !warmed { manager?.stopUpdatingLocation() }
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: id)
        commandDelegate.send(result, callbackId: command.callbackId)
    }

    @objc(status:)
    func status(_ command: CDVInvokedUrlCommand) {
        let state: [String: Any] = ["recording": runId != nil, "paused": paused, "id": runId ?? NSNull()]
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: state as [AnyHashable: Any])
        commandDelegate.send(result, callbackId: command.callbackId)
    }

    @objc(list:)
    func list(_ command: CDVInvokedUrlCommand) {
        let files = (try? FileManager.default.contentsOfDirectory(at: folder(), includingPropertiesForKeys: [.fileSizeKey])) ?? []
        let runs: [[String: Any]] = files
            .filter { $0.pathExtension == "jsonl" }
            .map { url in
                let bytes = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
                return ["id": url.deletingPathExtension().lastPathComponent, "bytes": bytes]
            }
            .sorted { ($0["id"] as? String ?? "") > ($1["id"] as? String ?? "") }
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: runs as [Any])
        commandDelegate.send(result, callbackId: command.callbackId)
    }

    @objc(read:)
    func read(_ command: CDVInvokedUrlCommand) {
        guard let url = runFile(command), let text = try? String(contentsOf: url, encoding: .utf8) else {
            fail(command, "no such run")
            return
        }
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: text)
        commandDelegate.send(result, callbackId: command.callbackId)
    }

    @objc(remove:)
    func remove(_ command: CDVInvokedUrlCommand) {
        guard let url = runFile(command), url.deletingPathExtension().lastPathComponent != runId else {
            fail(command, "that run cannot be deleted")
            return
        }
        do {
            try FileManager.default.removeItem(at: url)
            ok(command)
        } catch {
            fail(command, error.localizedDescription)
        }
    }

    // MARK: location

    private func locationManager() -> CLLocationManager {
        if let m = manager { return m }
        let m = CLLocationManager()
        m.delegate = self
        m.desiredAccuracy = kCLLocationAccuracyBest
        m.distanceFilter = kCLDistanceFilterNone
        m.activityType = .fitness
        m.pausesLocationUpdatesAutomatically = false
        manager = m
        return m
    }

    private func authStatus() -> CLAuthorizationStatus {
        if #available(iOS 14.0, *) { return locationManager().authorizationStatus }
        return CLLocationManager.authorizationStatus()
    }

    private func authName(_ s: CLAuthorizationStatus) -> String {
        switch s {
        case .notDetermined: return "unasked"
        case .authorizedWhenInUse, .authorizedAlways: return "granted"
        default: return "denied"
        }
    }

    /// Location on when it is allowed, the permission asked when it is not yet given, and the run begun when Start
    /// is waiting for it.
    private func ensureUpdates() {
        let m = locationManager()
        switch authStatus() {
        case .notDetermined:
            m.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            if wantsStart { begin() }
            m.startUpdatingLocation()
        default:
            wantsStart = false
            send(["type": "auth", "status": "denied"])
        }
    }

    private func begin() {
        wantsStart = false
        let id = "run-\(IAGps.nowMs())"
        let url = folder().appendingPathComponent(id + ".jsonl")
        guard FileManager.default.createFile(atPath: url.path, contents: nil), let h = try? FileHandle(forWritingTo: url) else {
            send(["type": "error", "message": "the run could not be saved on this phone"])
            return
        }
        handle = h
        runId = id
        paused = false
        let m = locationManager()
        m.allowsBackgroundLocationUpdates = true
        if #available(iOS 11.0, *) { m.showsBackgroundLocationIndicator = true }
        writeMark("start")
        startMotion(from: Date())
    }

    // MARK: steps and climb (D296)

    /// Asks Motion & Fitness once, when the recorder opens: a query of the last minute's steps is what makes iOS ask.
    private func askMotion() {
        guard CMPedometer.isStepCountingAvailable() else { return }
        if #available(iOS 11.0, *), CMPedometer.authorizationStatus() != .notDetermined { return }
        let now = Date()
        pedometer.queryPedometerData(from: now.addingTimeInterval(-60), to: now) { _, _ in }
    }

    /// The step counter from Start and the barometer, each reading written raw as it arrives. A refused permission or a
    /// missing sensor gives no readings, and the run goes on by GPS.
    private func startMotion(from start: Date) {
        if motionOn { return }
        motionOn = true
        if CMPedometer.isStepCountingAvailable() {
            pedometer.startUpdates(from: start) { [weak self] data, _ in
                guard let d = data else { return }
                var line: [String: Any] = [
                    "t": Int64((d.endDate.timeIntervalSince1970 * 1000).rounded()),
                    "steps": d.numberOfSteps.intValue,
                ]
                if let sd = d.distance { line["sd"] = sd.doubleValue }
                if let cad = d.currentCadence { line["cad"] = cad.doubleValue }
                let reading = line
                DispatchQueue.main.async { self?.writeMotion(reading) }
            }
        }
        if CMAltimeter.isRelativeAltitudeAvailable() {
            altimeter.startRelativeAltitudeUpdates(to: OperationQueue.main) { [weak self] data, _ in
                guard let d = data else { return }
                self?.writeMotion(["t": IAGps.nowMs(), "ralt": d.relativeAltitude.doubleValue, "kpa": d.pressure.doubleValue])
            }
        }
    }

    private func stopMotion() {
        guard motionOn else { return }
        motionOn = false
        pedometer.stopUpdates()
        altimeter.stopRelativeAltitudeUpdates()
    }

    /// On the main queue, like every write: into the run's file, and to the screen when it is showing.
    private func writeMotion(_ line: [String: Any]) {
        guard runId != nil else { return }
        write(line)
        if UIApplication.shared.applicationState == .active { send(["type": "motion", "line": line]) }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let active = UIApplication.shared.applicationState == .active
        for loc in locations {
            let fix = IAGps.fix(loc)
            if runId != nil { write(fix) }
            // In the background the web view sleeps: the file has every fix, and the page reads it back on return.
            if active { send(["type": "fix", "fix": fix, "recorded": runId != nil]) }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // kCLErrorLocationUnknown is iOS still looking; it keeps trying by itself.
        if (error as? CLError)?.code == .locationUnknown { return }
        send(["type": "error", "message": error.localizedDescription])
    }

    @available(iOS 14.0, *)
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authChanged(manager.authorizationStatus)
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if #available(iOS 14.0, *) { return }
        authChanged(status)
    }

    private func authChanged(_ status: CLAuthorizationStatus) {
        send(["type": "auth", "status": authName(status)])
        if status == .notDetermined { return }
        if warmed || wantsStart || runId != nil { ensureUpdates() }
    }

    // MARK: the file

    private func folder() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("ia-gps", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    /// The run file the first argument names: only a bare run id, so a call can never reach outside the folder.
    private func runFile(_ command: CDVInvokedUrlCommand) -> URL? {
        guard let id = command.argument(at: 0) as? String, id.hasPrefix("run-"),
              id.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "-" }) else { return nil }
        return folder().appendingPathComponent(id + ".jsonl")
    }

    private func writeMark(_ mark: String) {
        let line: [String: Any] = ["t": IAGps.nowMs(), "mark": mark]
        write(line)
        send(["type": "mark", "line": line])
    }

    private func write(_ line: [String: Any]) {
        guard let h = handle, var data = try? JSONSerialization.data(withJSONObject: line) else { return }
        data.append(0x0a)
        if #available(iOS 13.4, *) {
            try? h.seekToEnd()
            try? h.write(contentsOf: data)
        } else {
            h.seekToEndOfFile()
            h.write(data)
        }
    }

    private func closeFile() {
        if #available(iOS 13.0, *) { try? handle?.close() } else { handle?.closeFile() }
        handle = nil
    }

    /// What iOS reported, as it reported it: a negative accuracy is iOS saying it has no value.
    private static func fix(_ loc: CLLocation) -> [String: Any] {
        var f: [String: Any] = [
            "t": Int64((loc.timestamp.timeIntervalSince1970 * 1000).rounded()),
            "lat": loc.coordinate.latitude,
            "lon": loc.coordinate.longitude,
            "ha": loc.horizontalAccuracy,
            "alt": loc.altitude,
            "va": loc.verticalAccuracy,
            "spd": loc.speed,
            "sa": loc.speedAccuracy,
            "crs": loc.course,
        ]
        if #available(iOS 13.4, *) { f["ca"] = loc.courseAccuracy }
        return f
    }

    private static func nowMs() -> Int64 {
        Int64((Date().timeIntervalSince1970 * 1000).rounded())
    }

    // MARK: the bridge

    private func send(_ event: [String: Any]) {
        guard let id = listener else { return }
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: event as [AnyHashable: Any])
        result.setKeepCallbackAs(true)
        commandDelegate.send(result, callbackId: id)
    }

    private func ok(_ command: CDVInvokedUrlCommand) {
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
        commandDelegate.send(result, callbackId: command.callbackId)
    }

    private func fail(_ command: CDVInvokedUrlCommand, _ message: String) {
        let result: CDVPluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: message)
        commandDelegate.send(result, callbackId: command.callbackId)
    }
}
