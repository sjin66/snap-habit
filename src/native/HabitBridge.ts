import { NativeModules, Platform } from 'react-native';
import type { TodayHabitItem } from '../types/habit';

const HabitBridgeModule = NativeModules.HabitBridge;

/**
 * Sync today's habit snapshot to the shared App Group container
 * so the iOS widget can read it.
 */
async function syncSnapshotToWidget(items: TodayHabitItem[]): Promise<void> {
  if (Platform.OS !== 'ios' || !HabitBridgeModule) return;

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const snapshot = {
    date: dateStr,
    habits: items,
    updatedAt: new Date().toISOString(),
  };

  try {
    await HabitBridgeModule.syncSnapshot(JSON.stringify(snapshot));
    await HabitBridgeModule.reloadWidget();
  } catch (e) {
    console.warn('[HabitBridge] syncSnapshot failed:', e);
  }
}

/**
 * Trigger widget timeline refresh
 */
async function reloadWidget(): Promise<void> {
  if (Platform.OS !== 'ios' || !HabitBridgeModule) return;
  try {
    await HabitBridgeModule.reloadWidget();
  } catch (e) {
    console.warn('[HabitBridge] reloadWidget failed:', e);
  }
}

export const habitBridge = {
  syncSnapshotToWidget,
  reloadWidget,
};

