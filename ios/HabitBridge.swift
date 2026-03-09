import Foundation
import React
import WidgetKit

/// React Native native module for syncing habit data to shared App Group
/// container and triggering widget timeline refreshes.
@objc(HabitBridge)
class HabitBridge: NSObject {

  private static let appGroupID = "group.com.snaphabit.app"
  private static let snapshotKey = "today_snapshot"

  /// Write a TodaySnapshot JSON string to shared UserDefaults
  @objc
  func syncSnapshot(_ jsonString: String,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: HabitBridge.appGroupID) else {
      reject("ERR_APP_GROUP", "Cannot access App Group: \(HabitBridge.appGroupID)", nil)
      return
    }
    defaults.set(jsonString, forKey: HabitBridge.snapshotKey)
    defaults.synchronize()
    resolve(nil)
  }

  /// Trigger WidgetKit to reload all timelines
  @objc
  func reloadWidget(_ resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    resolve(nil)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
