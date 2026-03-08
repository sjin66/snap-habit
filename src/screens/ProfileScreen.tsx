import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, useColorScheme, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { useI18n, Language } from '../i18n';
import { useHabitStore } from '../stores/habitStore';
import { cancelAllReminders, scheduleHabitReminders } from '../services/notifications';

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'zh', label: '中文' },
];

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, language, setLanguage } = useI18n();
  const { habits } = useHabitStore();
  const [notificationsOn, setNotificationsOn] = useState(false);

  // Check current notification permission status
  const checkPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsOn(status === 'granted');
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsOn(true);
        // Re-schedule all habit reminders
        for (const habit of habits) {
          if (habit.reminders && habit.reminders.length > 0) {
            await scheduleHabitReminders(habit.id, habit.name, habit.reminders, habit.frequency);
          }
        }
      } else {
        // Permission denied — guide user to settings
        Alert.alert(
          t.notificationsDisabled,
          t.enableNotificationsMsg,
          [
            { text: t.cancel, style: 'cancel' },
            { text: t.settings, onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }},
          ],
        );
      }
    } else {
      // Turn off — cancel all reminders
      await cancelAllReminders();
      setNotificationsOn(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          {t.settings}
        </Text>
      </View>

      {/* Notifications Section */}
      <View className="mx-5 mt-6 rounded-2xl bg-card dark:bg-card-dark border border-border dark:border-border-dark overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center flex-1">
            <Ionicons name="notifications-outline" size={20} color={isDark ? '#EBEBEB' : '#141414'} />
            <View className="ml-2 flex-1">
              <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                {t.notifications}
              </Text>
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
                {t.notificationsDesc}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: isDark ? '#3A3A3C' : '#E5E5EA', true: isDark ? '#EBEBEB' : '#141414' }}
            thumbColor={isDark ? '#111111' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Language Section */}
      <View className="mx-5 mt-4 rounded-2xl bg-card dark:bg-card-dark border border-border dark:border-border-dark overflow-hidden">
        <View className="px-4 py-3 border-b border-border dark:border-border-dark">
          <View className="flex-row items-center">
            <Ionicons name="globe-outline" size={20} color={isDark ? '#EBEBEB' : '#141414'} />
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark ml-2">
              {t.language}
            </Text>
          </View>
        </View>

        {LANGUAGES.map((lang, index) => {
          const isSelected = lang.key === language;
          return (
            <TouchableOpacity
              key={lang.key}
              onPress={() => setLanguage(lang.key)}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                index < LANGUAGES.length - 1 ? 'border-b border-border dark:border-border-dark' : ''
              }`}
            >
              <Text className="text-base text-foreground dark:text-foreground-dark">
                {lang.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={20} color={isDark ? '#EBEBEB' : '#141414'} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
