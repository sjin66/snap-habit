import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n, Language } from '../i18n';

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'zh', label: '中文' },
];

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, language, setLanguage } = useI18n();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          {t.settings}
        </Text>
      </View>

      {/* Language Section */}
      <View className="mx-5 mt-6 rounded-2xl bg-card dark:bg-card-dark border border-border dark:border-border-dark overflow-hidden">
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
