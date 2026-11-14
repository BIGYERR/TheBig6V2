// The Expo app's widget extension, empty on purpose (MIGRATION.md phase 2, the native spike). It declares one widget
// with nothing in it, so the extension is a valid WidgetKit bundle that builds, signs and uploads, and the widget
// gallery offers nothing. Phase 4 moves the rest stopwatch and its Live Activity in.
import SwiftUI
import WidgetKit

struct RestTimerWidget: Widget {
  var body: some WidgetConfiguration {
    EmptyWidgetConfiguration()
  }
}

@main
struct RestTimerWidgetBundle: WidgetBundle {
  var body: some Widget {
    RestTimerWidget()
  }
}
