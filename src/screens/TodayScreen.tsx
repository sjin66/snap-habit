import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ProgressCard } from '../components/ProgressCard';
import { HabitCard } from '../components/HabitCard';
import { useHabitStore } from '../stores/habitStore';
import type { TodayHabitItem } from '../types/habit';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(): { weekday: string; full: string } {
  const now = new Date();
  return {
    weekday: DAYS[now.getDay()],
    full: `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`,
  };
}

// Mock streak map (habitId → streak count)
const MOCK_STREAKS: Record<string, number> = {
  '1': 14,
  '2': 7,
  '3': 21,
  '4': 5,
};

export function TodayScreen() {
  const { habits, setHabits, checkIn, getTodayItems } = useHabitStore();
  const navigation = useNavigation<any>();
  const dateStr = formatDate().full;
  const colorScheme = useColorScheme();

  // Seed mock data on first render
  useEffect(() => {
    if (habits.length === 0) {
      setHabits([
        {
          id: '1',
          name: 'Drink Water',
          icon: 'water',
          color: '#FF8C00',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Meditation',
          icon: 'leaf',
          color: '#6C63FF',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Reading',
          icon: 'book',
          color: '#4CAF50',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Push Ups',
          icon: 'fitness',
          color: '#4CAF50',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const todayItems = getTodayItems();
  const completed = todayItems.filter((h) => h.isCompleted).length;
  const total = todayItems.length;

  const handleCheckIn = useCallback(
    (habitId: string) => {
      checkIn(habitId);
    },
    [checkIn],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TodayHabitItem>) => (
      <HabitCard
        item={item}
        streak={MOCK_STREAKS[item.habitId] ?? 0}
        onCheckIn={handleCheckIn}
      />
    ),
    [handleCheckIn],
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
      />
      <FlatList
        data={todayItems}
        keyExtractor={(item) => item.habitId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="flex-row justify-between items-start px-5 pt-3 pb-5">
              <View>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark mb-0.5">
                  {dateStr}
                </Text>
                <Text className="text-[32px] font-extrabold text-foreground dark:text-foreground-dark tracking-tight">
                  Today
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddHabit')}
                activeOpacity={0.7}
                className="w-11 h-11 rounded-full bg-secondary dark:bg-secondary-dark justify-center items-center shadow-sm mt-1 border border-border dark:border-border-dark"
              >
                <Text className="text-[22px] text-foreground dark:text-foreground-dark font-light leading-[26px]">
                  +
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress card */}
            <ProgressCard completed={completed} total={total} />
            <View className="h-6" />
          </>
        }
        ListFooterComponent={<View className="h-8" />}
      />
    </SafeAreaView>
  );
}
