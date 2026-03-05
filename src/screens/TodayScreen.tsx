import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  const { habits, checkIn, uncheckIn, deleteHabit, reorderHabits, getTodayItems } = useHabitStore();
  const navigation = useNavigation<any>();
  const dateStr = formatDate().full;
  const colorScheme = useColorScheme();

  const [isJiggling, setIsJiggling] = useState(false);

  // Re-trigger entering animations only on tab press (not on stack back navigation)
  const [animKey, setAnimKey] = useState(0);
  const isTabPress = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      isTabPress.current = true;
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (isTabPress.current) {
        setAnimKey((k) => k + 1);
        isTabPress.current = false;
      }
    }, [])
  );

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

      {/* Fixed header */}
      <View className="pt-3 pb-2">
        <View className="flex-row justify-between items-start px-5">
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
        <View className="mt-3">
          <ProgressCard completed={completed} total={total} />
        </View>
      </View>

      <DraggableFlatList
        key={animKey}
        data={todayItems}
        keyExtractor={(item) => item.habitId}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        activationDistance={isJiggling ? 5 : 10000}
        containerStyle={{ flex: 1 }}
        ListHeaderComponent={<View className="h-3" />}
        ListFooterComponent={<View className="h-8" />}
      />
    </SafeAreaView>
  );
}
