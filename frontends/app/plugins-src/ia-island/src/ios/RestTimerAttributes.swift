// The rest stopwatch Live Activity's data (V239 D233 P-ISLAND).
// Compiled into the app (by the ia-island plugin) and into the widget extension (slice N2), so it imports no
// Cordova and nothing app-only.

import ActivityKit
import Foundation

/// No static attributes: the activity carries only the clock. Never the session name (D233 R4).
@available(iOS 16.1, *)
struct RestTimerAttributes: ActivityAttributes {
    /// running: counting up from `start` (the page's epoch anchor); `elapsed` is 0.
    /// stopped: frozen at `elapsed`, in seconds; `start` is the anchor that frozen value implies.
    struct ContentState: Codable, Hashable {
        var running: Bool
        var start: Date
        var elapsed: Double
    }
}
