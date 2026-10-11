// The native side of window.iaIsland (V239 D233 P-ISLAND): the rest stopwatch as a Live Activity.
//   run   [startEpochMs]  running, counting up from that epoch
//   stop  [elapsedMs]     stopped at that frozen value
//   end   []              no activity
// Display only (R5): no push type, no network, no intents. The app's deployment target stays 13.0, so every
// ActivityKit path sits behind iOS 16.2, where ActivityContent and the content-based update/end/request exist.

import ActivityKit
import Foundation
#if canImport(Cordova)
import Cordova
#endif

@objc(IAIsland)
class IAIsland: CDVPlugin {
    /// The tail of one serial work chain. Each call waits for the one before it to finish, so a burst such as
    /// stop(x) then end() lands in arrival order and the last call wins. (An actor would not do: its awaits let
    /// a later call interleave.)
    private var tail: Task<Void, Never>?
    private let tailLock = NSLock()

    override func pluginInitialize() {
        super.pluginInitialize()
        // R3 boot: a reload starts the stopwatch at 0:00 stopped, so nothing the app left behind may survive it.
        enqueue {
            if #available(iOS 16.2, *) { await RestActivity.endAll() }
        }
    }

    @objc(run:)
    func run(_ command: CDVInvokedUrlCommand) {
        guard let ms = IAIsland.number(command) else { return }
        let start = Date(timeIntervalSince1970: ms / 1000)
        enqueue {
            if #available(iOS 16.2, *) { await RestActivity.run(from: start) }
        }
    }

    @objc(stop:)
    func stop(_ command: CDVInvokedUrlCommand) {
        guard let ms = IAIsland.number(command) else { return }
        let seconds = max(0, ms) / 1000
        enqueue {
            if #available(iOS 16.2, *) { await RestActivity.stop(at: seconds) }
        }
    }

    @objc(end:)
    func end(_ command: CDVInvokedUrlCommand) {
        enqueue {
            if #available(iOS 16.2, *) { await RestActivity.endAll() }
        }
    }

    private func enqueue(_ work: @escaping @Sendable () async -> Void) {
        tailLock.lock()
        defer { tailLock.unlock() }
        let previous = tail
        tail = Task {
            await previous?.value
            await work()
        }
    }

    /// The first argument as a finite number, or nil (the call is then ignored).
    private static func number(_ command: CDVInvokedUrlCommand) -> Double? {
        guard let value = (command.argument(at: 0) as? NSNumber)?.doubleValue, value.isFinite else { return nil }
        return value
    }
}

@available(iOS 16.2, *)
private enum RestActivity {
    /// Live Activities off for this app: every call does nothing.
    static var enabled: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

    /// The activities still on screen. One the athlete dismissed or that already ended cannot be updated.
    static var live: [Activity<RestTimerAttributes>] {
        Activity<RestTimerAttributes>.activities.filter { $0.activityState == .active || $0.activityState == .stale }
    }

    static func run(from start: Date) async {
        guard enabled else { return }
        let state = RestTimerAttributes.ContentState(running: true, start: start, elapsed: 0)
        let content = ActivityContent(state: state, staleDate: nil)
        let current = live
        if current.isEmpty {
            _ = try? Activity<RestTimerAttributes>.request(attributes: RestTimerAttributes(), content: content, pushType: nil)
        } else {
            for activity in current { await activity.update(content) }
        }
    }

    static func stop(at seconds: Double) async {
        guard enabled else { return }
        let state = RestTimerAttributes.ContentState(
            running: false, start: Date().addingTimeInterval(-seconds), elapsed: seconds)
        let content = ActivityContent(state: state, staleDate: nil)
        for activity in live { await activity.update(content) }
    }

    static func endAll() async {
        guard enabled else { return }
        for activity in Activity<RestTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}
