import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
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

export function TodayScreen() {
  const { habits, setHabits, checkIn, uncheckIn, deleteHabit, reorderHabits, getTodayItems } = useHabitStore();
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
          dailyTarget: 8,
          unit: 'glasses',
        },
        {
          id: '2',
          name: 'Meditation',
          icon: 'leaf',
          color: '#6C63FF',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
          dailyTarget: 10,
          unit: 'minutes',
        },
        {
          id: '3',
          name: 'Reading',
          icon: 'book',
          color: '#4CAF50',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
          dailyTarget: 30,
          unit: 'minutes',
        },
        {
          id: '4',
          name: 'Push Ups',
          icon: 'fitness',
          color: '#4CAF50',
          frequency: { type: 'daily' },
          createdAt: new Date().toISOString(),
          dailyTarget: 20,
          unit: 'reps',
        },
      ]);
    }
  }, []);

  const [isJiggling, setIsJiggling] = useState(false);

  const todayItems = getTodayItems();
  const completed = todayItems.filter((h) => h.isCompleted).length;
  const total = todayItems.length;

  const handleLongPress = useCallback(() => {
    setIsJiggling(true);
  }, []);

  const handleCheckIn = useCallback(
    (habitId: string) => {
      const item = todayItems.find((h) => h.habitId === habitId);
      if (item?.isCompleted) {
        uncheckIn(habitId);
      } else {
        checkIn(habitId);
      }
    },
    [checkIn, uncheckIn, todayItems],
  );

  const handleDelete = useCallback(
    (habitId: string) => {
      deleteHabit(habitId);
    },
    [deleteHabit],
  );

  const handleEdit = useCallback(
    (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      navigation.navigate('NewHabit', {
        editHabitId: habit.id,
        presetName: habit.name,
        presetIcon: habit.icon,
        presetColor: habit.color,
        presetGoal: habit.dailyTarget,
        presetUnit: habit.unit,
      });
    },
    [navigation, habits],
  );

  const renderItem = useCallback(
    ({ item, getIndex, drag, isActive }: RenderItemParams<TodayHabitItem>) => {
      const index = getIndex() ?? 0;
      return (
        <ScaleDecorator>
          <HabitCard
            item={item}
            index={index}
            onCheckIn={handleCheckIn}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isJiggling={isJiggling}
            onLongPress={() => {
              if (!isJiggling) {
                setIsJiggling(true);
              } else {
                drag();
              }
            }}
            onDrag={isJiggling ? drag : undefined}
            isDragging={isActive}
          />
        </ScaleDecorator>
      );
    },
    [handleCheckIn, handleDelete, handleEdit, isJiggling, handleLongPress],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: TodayHabitItem[] }) => {
      reorderHabits(data.map((d) => d.habitId));
    },
    [reorderHabits],
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF'}
      />
      <DraggableFlatList
        data={todayItems}
        keyExtractor={(item) => item.habitId}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        activationDistance={isJiggling ? 5 : 10000}
        containerStyle={{ height: '100%' }}
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
              {isJiggling ? (
                <TouchableOpacity
                  onPress={() => setIsJiggling(false)}
                  activeOpacity={0.7}
                  className="px-4 h-9 rounded-full bg-primary dark:bg-primary-dark justify-center items-center mt-1"
                >
                  <Text className="text-[15px] font-semibold text-background dark:text-background-dark">
                    Done
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddHabit')}
                  activeOpacity={0.7}
                  className="w-11 h-11 rounded-full bg-foreground dark:bg-foreground-dark justify-center items-center shadow-sm mt-1 border border-border dark:border-border-dark"
                >
                  <Text className="text-[22px] font-normal text-secondary dark:text-secondary-dark  leading-[26px]">
                    +
                  </Text>
                </TouchableOpacity>
              )}
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
