import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Notification action identifiers ───
export const HABIT_CATEGORY = 'habit-reminder';
export const ACTION_CHECKIN = 'CHECKIN';
export const ACTION_SKIP = 'SKIP';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register a notification category with "Done" and "Skip" quick actions.
 * Call once on app startup.
 */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(HABIT_CATEGORY, [
    {
      identifier: ACTION_CHECKIN,
      buttonTitle: '✅ Done',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_SKIP,
      buttonTitle: '⏭ Skip',
      options: { opensAppToForeground: false },
    },
  ]);
}

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Convert ISO weekday (Mon=1 … Sun=7) to expo-notifications weekday (Sun=1 … Sat=7).
 */
function isoToExpoWeekday(iso: number): number {
  return (iso % 7) + 1; // Mon(1)→2, Tue(2)→3, … Sat(6)→7, Sun(7)→1
}

/**
 * Schedule reminders for a habit, respecting frequency.
 *
 * - daily: uses DAILY trigger (fires every day)
 * - weekly/custom with daysOfWeek: uses WEEKLY trigger (fires only on active days)
 *
 * Identifier format:
 *   daily   → `habit-${habitId}-${reminderIdx}`
 *   weekly  → `habit-${habitId}-${reminderIdx}-d${dayIdx}`
 */
export async function scheduleHabitReminders(
  habitId: string,
  habitName: string,
  reminders: string[], // ["HH:mm", ...]
  frequency?: { type: string; daysOfWeek?: number[] },
): Promise<void> {
  // Cancel any existing reminders for this habit first
  await cancelHabitReminders(habitId);

  const isWeekly =
    frequency &&
    (frequency.type === 'weekly' || frequency.type === 'custom') &&
    frequency.daysOfWeek &&
    frequency.daysOfWeek.length > 0;

  for (let i = 0; i < reminders.length; i++) {
    const [hours, minutes] = reminders[i].split(':').map(Number);
    const content: Notifications.NotificationContentInput = {
      title: '⏰ Habit Reminder',
      body: `Time to work on "${habitName}"!`,
      sound: true as const,
      categoryIdentifier: HABIT_CATEGORY,
      data: { habitId },
    };

    if (isWeekly) {
      // Schedule one WEEKLY notification per active day
      for (let d = 0; d < frequency!.daysOfWeek!.length; d++) {
        const expoWeekday = isoToExpoWeekday(frequency!.daysOfWeek![d]);
        await Notifications.scheduleNotificationAsync({
          identifier: `habit-${habitId}-${i}-d${d}`,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday,
            hour: hours,
            minute: minutes,
          },
        });
      }
    } else {
      // Daily habit — fire every day
      await Notifications.scheduleNotificationAsync({
        identifier: `habit-${habitId}-${i}`,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    }
  }
}

/**
 * Cancel all scheduled reminders for a habit.
 * Covers daily format (habit-{id}-{idx}) and weekly format (habit-{id}-{idx}-d{day}).
 */
export async function cancelHabitReminders(habitId: string): Promise<void> {
  // Cancel up to 20 reminder slots × 7 possible day slots
  for (let i = 0; i < 20; i++) {
    // Daily format
    try {
      await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}-${i}`);
    } catch {}
    // Weekly format (up to 7 days per reminder)
    for (let d = 0; d < 7; d++) {
      try {
        await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}-${i}-d${d}`);
      } catch {}
    }
  }
  // Also cancel legacy single-reminder identifier
  try {
    await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`);
  } catch {}
}

/** Cancel all scheduled notifications. */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Refresh all habit reminders based on current completion status.
 * - Completed habits today → cancel their reminders
 * - Uncompleted habits with reminders → (re)schedule them
 * Call on app start and after any check-in/uncheckIn.
 */
export async function refreshAllReminders(
  habits: { id: string; name: string; reminders?: string[]; frequency: { type: string; daysOfWeek?: number[] } }[],
  completedHabitIds: Set<string>,
): Promise<void> {
  for (const habit of habits) {
    if (!habit.reminders || habit.reminders.length === 0) continue;

    if (completedHabitIds.has(habit.id)) {
      // Already done today — no need to remind
      await cancelHabitReminders(habit.id);
    } else {
      // Not done yet — ensure reminders are active
      await scheduleHabitReminders(habit.id, habit.name, habit.reminders, habit.frequency);
    }
  }
}
