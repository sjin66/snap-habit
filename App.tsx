import './global.css';
import React, { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { RootNavigator } from '@navigation/RootNavigator';
import { useHabitStore } from '@stores/habitStore';
import { useI18n } from './src/i18n';
import {
  setupNotificationCategories,
  ACTION_CHECKIN,
  ACTION_SKIP,
} from './src/services/notifications';

export default function App() {
  const colorScheme = useColorScheme();
  const initialize = useHabitStore((s) => s.initialize);
  const loadLanguage = useI18n((s) => s.loadLanguage);
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initialize();
    loadLanguage();
    setupNotificationCategories();
  }, []);

  // Listen for notification action responses (check-in / skip from notification)
  useEffect(() => {
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data as
          | { habitId?: string }
          | undefined;
        const habitId = data?.habitId;
        if (!habitId) return;

        const store = useHabitStore.getState();
        if (actionId === ACTION_CHECKIN) {
          store.checkIn(habitId);
        } else if (actionId === ACTION_SKIP) {
          store.skipHabit(habitId);
        }
        // Default tap (no specific action) — app opens normally, no extra handling needed
      },
    );
    return () => {
      responseListenerRef.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator colorScheme={colorScheme} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
