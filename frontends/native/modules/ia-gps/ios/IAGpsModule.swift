// The Expo app's GPS module (MIGRATION.md phase 4): what replaces the Cordova plumbing of today's ia-gps plugin. The
// recorder itself is IAGps.swift, today's Swift. This file only names its eleven calls and its one event to
// JavaScript (src/run-recorder/gps.ts, which hands the screen today's window.iaGps shape).
// Every call runs on the main queue, as Cordova ran the plugin's: Core Location delivers to the thread its manager
// was made on, and the recorder writes its file from there. Calls arrive in the order JavaScript made them.
import ExpoModulesCore

public class IAGpsModule: Module {
  private lazy var gps = IAGps { [weak self] event in
    self?.sendEvent("onGps", event)
  }

  public func definition() -> ModuleDefinition {
    Name("IAGps")

    Events("onGps")

    AsyncFunction("listen") { () -> Void in
      self.gps.listen()
    }.runOnQueue(.main)

    AsyncFunction("warm") { () -> Void in
      self.gps.warm()
    }.runOnQueue(.main)

    AsyncFunction("cool") { () -> Void in
      self.gps.cool()
    }.runOnQueue(.main)

    AsyncFunction("start") { () -> Void in
      self.gps.start()
    }.runOnQueue(.main)

    AsyncFunction("pause") { () -> Void in
      self.gps.pause()
    }.runOnQueue(.main)

    AsyncFunction("resume") { () -> Void in
      self.gps.resume()
    }.runOnQueue(.main)

    AsyncFunction("finish") { () -> [String: Any] in
      self.gps.finish()
    }.runOnQueue(.main)

    AsyncFunction("status") { () -> [String: Any] in
      self.gps.status()
    }.runOnQueue(.main)

    AsyncFunction("list") { () -> [[String: Any]] in
      self.gps.list()
    }.runOnQueue(.main)

    AsyncFunction("read") { (id: String) -> [String: Any] in
      self.gps.read(id)
    }.runOnQueue(.main)

    AsyncFunction("remove") { (id: String) -> [String: Any] in
      self.gps.remove(id)
    }.runOnQueue(.main)
  }
}
