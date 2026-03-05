import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { cancelHabitReminder } from '../services/notifications';
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

  // Stable key for dependency tracking (changes only on actual data change)
  const itemsKey = todayItems.map((i) => `${i.habitId}:${i.isCompleted}`).join(',');

  // Display list: sorted unchecked-first, with animated reorder on check-in
  const [displayItems, setDisplayItems] = useState<TodayHabitItem[]>([]);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMoveRef = useRef(false);

  // Sync display items from store (respects pending animation and jiggle mode)
  useEffect(() => {
    if (isJiggling) {
      // In jiggle/drag mode — don't override manual order, just refresh data in place
      setDisplayItems((prev) =>
        prev.map((p) => {
          const fresh = todayItems.find((t) => t.habitId === p.habitId);
          return fresh ?? p;
        }).filter((p) => todayItems.some((t) => t.habitId === p.habitId))
      );
    } else if (pendingMoveRef.current) {
      // Animation pending — just update data in place, keep current order
      setDisplayItems((prev) =>
        prev.map((p) => {
          const fresh = todayItems.find((t) => t.habitId === p.habitId);
          return fresh ?? p;
        }).filter((p) => todayItems.some((t) => t.habitId === p.habitId))
      );
    } else {
      // No animation pending — sort normally
      const sorted = [...todayItems].sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
      });
      setDisplayItems(sorted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const handleLongPress = useCallback(() => {
    setIsJiggling(true);
  }, []);

  const handleCheckIn = useCallback(
    (habitId: string) => {
      const item = todayItems.find((h) => h.habitId === habitId);
      const willComplete = !item?.isCompleted;

      // Mark that we have a pending reorder animation
      pendingMoveRef.current = true;

      // Update store immediately (checkmark appears)
      if (willComplete) {
        checkIn(habitId);
      } else {
        uncheckIn(habitId);
      }

      // After checkmark animation plays, reorder
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => {
        pendingMoveRef.current = false;
        setDisplayItems((prev) => {
          const updated = prev.map((p) =>
            p.habitId === habitId ? { ...p, isCompleted: willComplete } : p
          );
          return updated.sort((a, b) => {
            if (a.isCompleted === b.isCompleted) return 0;
            return a.isCompleted ? 1 : -1;
          });
        });
      }, 400);
    },
    [checkIn, uncheckIn, todayItems],
  );

  const handleDelete = useCallback(
    (habitId: string) => {
      cancelHabitReminder(habitId);
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
      // Sync displayItems immediately so ScrollView matches DraggableFlatList
      setDisplayItems(data);
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
              onPress={() => {
                setIsJiggling(false);
                // Re-sort: unchecked first, checked last, preserving manual order within each group
                setDisplayItems((prev) =>
                  [...prev].sort((a, b) => {
                    if (a.isCompleted === b.isCompleted) return 0;
                    return a.isCompleted ? 1 : -1;
                  })
                );
              }}
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

      <View style={{ flex: 1 }}>
        {/* Normal mode: ScrollView always mounted to avoid flash */}
        <ScrollView
          style={{ flex: 1 }}
          pointerEvents={isJiggling ? 'none' : 'auto'}
          scrollEnabled={!isJiggling}
        >
          <View className="h-3" />
          {displayItems.map((item, index) => (
            <Animated.View key={item.habitId} layout={LinearTransition.duration(350)}>
              <HabitCard
                item={item}
                index={index}
                onCheckIn={handleCheckIn}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isJiggling={false}
                onLongPress={() => setIsJiggling(true)}
              />
            </Animated.View>
          ))}
          <View className="h-8" />
        </ScrollView>

        {/* Jiggle mode: DraggableFlatList always mounted, hidden when inactive */}
        <View
          pointerEvents={isJiggling ? 'auto' : 'none'}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colorScheme === 'dark' ? '#111111' : '#FFFFFF',
              opacity: isJiggling ? 1 : 0,
            },
          ]}
        >
          <DraggableFlatList
            data={displayItems}
            keyExtractor={(item) => item.habitId}
            renderItem={renderItem}
            onDragEnd={handleDragEnd}
            activationDistance={5}
            containerStyle={{ flex: 1 }}
            ListHeaderComponent={<View className="h-3" />}
            ListFooterComponent={<View className="h-8" />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
