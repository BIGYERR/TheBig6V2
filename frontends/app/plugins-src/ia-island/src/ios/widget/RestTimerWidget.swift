// The rest stopwatch Live Activity as iOS draws it (V239 D233 P-ISLAND): the Dynamic Island and the lock screen.
// Built into the RestTimerWidget app extension (hooks/add-widget-target.js) together with RestTimerAttributes.swift,
// the same file the app compiles. R4 is the copy; R5 is display only: no buttons, no intents, and a tap opens the app.

import ActivityKit
import SwiftUI
import WidgetKit

@main
struct RestTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        RestTimerLiveActivity()
    }
}

/// D233 R4, verbatim. The only words the athlete sees here.
private enum Copy {
    static let title = "Rest Timer"
    static let running = "Your rest is on the clock."
    static let stopped = "Stopped. Tap to open the app."
}

/// THE_ASYLUM_DS_REFERENCE.md tokens.
private enum Palette {
    static let signal = Color(rgb: 0xCF4E1A)  // --signal: the running rest timer
    static let bone = Color(rgb: 0xF4F1E8)    // --on-ink: text on ink
    static let ink = Color(rgb: 0x181712)     // --text: ink
}

/// Text(timerInterval:) takes every point it is offered, so the compact clock gets a fixed width.
private let compactClockWidth: CGFloat = 48

struct RestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            RestExpanded(state: context.state)
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .activityBackgroundTint(Palette.ink)
                .activitySystemActionForegroundColor(Palette.bone)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    RestTitle()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 2) {
                        RestClock(state: context.state)
                            .font(.system(size: 34, weight: .bold))
                            .foregroundColor(Palette.signal)
                        RestLine(running: context.state.running)
                    }
                }
            } compactLeading: {
                Image(systemName: context.state.running ? "timer" : "pause.fill")
                    .foregroundColor(Palette.signal)
            } compactTrailing: {
                RestClock(state: context.state)
                    .foregroundColor(Palette.signal)
                    .multilineTextAlignment(.trailing)
                    .frame(width: compactClockWidth, alignment: .trailing)
            } minimal: {
                RestClock(state: context.state)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(context.state.running ? AnyShapeStyle(Palette.signal) : AnyShapeStyle(.secondary))
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.6)
            }
            .keylineTint(Palette.signal)
        }
    }
}

/// Expanded content, also the lock screen banner: Rest Timer / the clock / the line.
private struct RestExpanded: View {
    let state: RestTimerAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            RestTitle()
            RestClock(state: state)
                .font(.system(size: 34, weight: .bold))
                .foregroundColor(Palette.signal)
            RestLine(running: state.running)
        }
    }
}

private struct RestTitle: View {
    var body: some View {
        Text(Copy.title)
            .font(.subheadline.weight(.semibold))
            .foregroundColor(Palette.bone)
    }
}

private struct RestLine: View {
    let running: Bool

    var body: some View {
        Text(running ? Copy.running : Copy.stopped)
            .font(.footnote)
            .foregroundColor(Palette.bone)
    }
}

/// The rest clock: m:ss, h:mm:ss past an hour, never hundredths. Running, iOS ticks it from the anchor with no
/// updates; stopped, it is the frozen value.
private struct RestClock: View {
    let state: RestTimerAttributes.ContentState

    var body: some View {
        Group {
            if state.running {
                Text(timerInterval: state.start...Date.distantFuture, countsDown: false)
            } else {
                Text(RestClock.frozen(state.elapsed))
            }
        }
        .monospacedDigit()
    }

    static func frozen(_ seconds: Double) -> String {
        let total = seconds.isFinite ? Int(max(0, seconds)) : 0
        let h = total / 3600, m = total / 60 % 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }
}

private extension Color {
    init(rgb: UInt32) {
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255)
    }
}
