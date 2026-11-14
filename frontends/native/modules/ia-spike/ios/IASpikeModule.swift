// A Swift module that does nothing (MIGRATION.md phase 2, the native spike). JavaScript asks it one question and it
// answers with a word of its own, which proves Swift written in this repo is compiled into the Expo app and reachable
// from Hermes. It reads nothing, writes nothing and keeps nothing. IAGps and IAIsland arrive this way in phase 4.
import ExpoModulesCore

public class IASpikeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IASpike")

    Function("answer") { () -> String in
      "swift"
    }
  }
}
