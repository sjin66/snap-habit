import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule daily reminders for a habit (supports multiple times).
 * Uses `habit-${habitId}-${index}` as notification identifiers.
 */
export async function scheduleHabitReminders(
  habitId: string,
  habitName: string,
  reminders: string[], // ["HH:mm", ...]
): Promise<void> {
  // Cancel any existing reminders for this habit first
  await cancelHabitReminders(habitId);

  for (let i = 0; i < reminders.length; i++) {
    const [hours, minutes] = reminders[i].split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habitId}-${i}`,
      content: {
        title: '⏰ Habit Reminder',
        body: `Time to work on "${habitName}"!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  }
}

/** Cancel all scheduled reminders for a habit (up to 20 slots). */
export async function cancelHabitReminders(habitId: string): Promise<void> {
  // Cancel indexed identifiers (new format)
  for (let i = 0; i < 20; i++) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`habit-${habitId}-${i}`);
    } catch {}
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
