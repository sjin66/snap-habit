import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const dateStr = formatDate().full;

  // Seed mock data on first render
  useEffect(() => {
    if (habits.length === 0) {
      setHabits([
        {
          id: '1',
          name: 'Drink Water',
          icon: '💧',
          color: '#FF8C00',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Meditation',
          icon: '🧘',
          color: '#6C63FF',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Reading',
          icon: '📚',
          color: '#4CAF50',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Push Ups',
          icon: '💪',
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F3F7" />
      <FlatList
        data={todayItems}
        keyExtractor={(item) => item.habitId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.dateText}>{dateStr}</Text>
                <Text style={styles.titleText}>Today</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Progress card */}
            <ProgressCard completed={completed} total={total} />
            <View style={styles.sectionGap} />
          </>
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F3F7',
  },
  list: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 4,
  },
  addIcon: {
    fontSize: 22,
    color: '#1A1A2E',
    fontWeight: '300',
    lineHeight: 26,
  },
  sectionGap: {
    height: 24,
  },
  separator: {
    height: 12,
  },
});
