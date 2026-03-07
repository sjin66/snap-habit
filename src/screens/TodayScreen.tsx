import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { cancelHabitReminders } from '../services/notifications';
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

/** Sort order: active → completed → rest */
const STATUS_ORDER: Record<string, number> = { active: 0, completed: 1, rest: 2 };
function sortByStatus(a: TodayHabitItem, b: TodayHabitItem): number {
  return (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
}

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

  // Shared scroll offset tracking
  const scrollOffsetRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<any>(null);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const todayItems = getTodayItems();
  // Only count active + completed toward progress (exclude rest days)
  const activeItems = todayItems.filter((h) => h.status !== 'rest');
  const completed = activeItems.filter((h) => h.isCompleted).length;
  const total = activeItems.length;

  // Stable key for dependency tracking (changes only on actual data change)
  const itemsKey = todayItems.map((i) => `${i.habitId}:${i.isCompleted}:${i.status}:${i.name}:${i.category ?? ''}`).join(',');

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
      const sorted = [...todayItems].sort(sortByStatus);
      setDisplayItems(sorted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

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
            p.habitId === habitId
              ? { ...p, isCompleted: willComplete, status: willComplete ? 'completed' as const : (p.status === 'rest' ? 'rest' as const : 'active' as const) }
              : p
          );
          return updated.sort(sortByStatus);
        });
      }, 400);
    },
    [checkIn, uncheckIn, todayItems],
  );

  const handleDelete = useCallback(
    (habitId: string) => {
      cancelHabitReminders(habitId);
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
    [handleCheckIn, handleDelete, handleEdit, isJiggling],
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
                const savedY = scrollOffsetRef.current;
                // 1. Scroll ScrollView to match position (behind overlay)
                scrollViewRef.current?.scrollTo({ y: savedY, animated: false });

                requestAnimationFrame(() => {
                  scrollViewRef.current?.scrollTo({ y: savedY, animated: false });
                  setTimeout(() => {
                    // 2. Hide overlay first — ScrollView now visible with old order
                    setIsJiggling(false);
                    // 3. Then sort — LinearTransition animates the reorder visibly
                    requestAnimationFrame(() => {
                      setDisplayItems((prev) => [...prev].sort(sortByStatus));
                    });
                  }, 50);
                });
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
          ref={scrollViewRef}
          style={{ flex: 1 }}
          pointerEvents={isJiggling ? 'none' : 'auto'}
          scrollEnabled={!isJiggling}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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
                onLongPress={() => {
                  flatListRef.current?.scrollToOffset({ offset: scrollOffsetRef.current, animated: false });
                  setIsJiggling(true);
                }}
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
            ref={flatListRef}
            data={displayItems}
            keyExtractor={(item) => item.habitId}
            renderItem={renderItem}
            onDragEnd={handleDragEnd}
            activationDistance={5}
            containerStyle={{ flex: 1 }}
            onScrollEndDrag={handleScroll}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={<View className="h-3" />}
            ListFooterComponent={<View className="h-8" />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
