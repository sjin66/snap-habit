import './global.css';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootNavigator } from '@navigation/RootNavigator';
import { useHabitStore } from '@stores/habitStore';
import { useI18n } from './src/i18n';
import { LaunchScreen } from '@components/LaunchScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import {
  setupNotificationCategories,
  ACTION_CHECKIN,
  ACTION_SKIP,
} from './src/services/notifications';

const ONBOARDING_KEY = '@snaphabit_onboarding_done';

export default function App() {
  const colorScheme = useColorScheme();
  const initialize = useHabitStore((s) => s.initialize);
  const loadLanguage = useI18n((s) => s.loadLanguage);
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const [showLaunch, setShowLaunch] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    initialize();
    loadLanguage();
    setupNotificationCategories();
    // Check if onboarding has been completed
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingDone(value === 'true');
    });
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

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  }, []);

  if (showLaunch) {
    return (
      <LaunchScreen
        canFinish={onboardingDone !== null}
        onFinished={() => setShowLaunch(false)}
      />
    );
  }

  // Still loading onboarding state
  // Show onboarding on first launch
  if (!onboardingDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <RootNavigator colorScheme={colorScheme} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
