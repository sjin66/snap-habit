import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import { useHabitStore } from '../stores/habitStore';
import { getEntriesByHabitAndRange } from '../services/database';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'HabitDetail'>;

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Build real 14-day history from DB entries */
function buildHistory(habitId: string): ('done' | 'missed')[] {
  const today = formatDate(new Date());
  const start = formatDate(daysAgo(13));
  const entries = getEntriesByHabitAndRange(habitId, start, today);
  const completedDates = new Set(entries.map((e) => e.date));

  return Array.from({ length: 14 }, (_, i) => {
    const dateStr = formatDate(daysAgo(13 - i));
    return completedDates.has(dateStr) ? 'done' : 'missed';
  });
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Circular progress component
function CircularProgress({
  completed,
  total,
  color,
  size = 180,
  strokeWidth = 12,
}: {
  completed: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text */}
      <View className="absolute items-center">
        <Text className="text-[42px] font-bold text-foreground dark:text-foreground-dark">
          {completed}<Text className="text-muted-foreground dark:text-muted-foreground-dark font-light">/{total}</Text>
        </Text>
        <Text className="text-xs font-semibold tracking-widest text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
          SESSIONS
        </Text>
      </View>
    </View>
  );
}

export function HabitDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const { habitId } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { habits, todayEntries, checkIn } = useHabitStore();
  const habit = habits.find((h) => h.id === habitId);

  // Real data from DB
  const history = useMemo(() => buildHistory(habitId), [habitId, todayEntries]);

  const streak = useMemo(() => {
    // Count consecutive days completed going backward from today
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(daysAgo(i));
      const entries = getEntriesByHabitAndRange(habitId, dateStr, dateStr);
      if (entries.length > 0) {
        count++;
      } else if (i > 0) {
        break;
      } else {
        // Today not yet done — check from yesterday
        continue;
      }
    }
    return count;
  }, [habitId, todayEntries]);

  const totalCompletions = useMemo(() => {
    // All-time completions for this habit
    const entries = getEntriesByHabitAndRange(habitId, '2000-01-01', formatDate(new Date()));
    return new Set(entries.map((e) => e.date)).size;
  }, [habitId, todayEntries]);

  const successRate = useMemo(() => {
    const done = history.filter((d) => d === 'done').length;
    return Math.round((done / 14) * 100);
  }, [history]);

  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = todayEntries.some(
    (e) => e.habitId === habitId && e.date === today,
  );

  // Sessions: dailyTarget-based, 1 session = 1 check-in per day
  const sessionsTotal = habit?.dailyTarget ?? 1;
  const sessionsCompleted = isCompletedToday ? sessionsTotal : 0;

  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <Text className="text-muted-foreground dark:text-muted-foreground-dark">Habit not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FAFAFA' : '#0A0A0A'} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Details
        </Text>
        <TouchableOpacity hitSlop={12}>
          <Text className="text-base font-medium" style={{ color: habit.color }}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Name */}
        <View className="items-center pt-4 pb-2">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: habit.color + '1A' }}
          >
            <Ionicons name={habit.icon as any} size={36} color={habit.color} />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {habit.name}
          </Text>
        </View>

        {/* Stats row */}
        <View className="flex-row items-center justify-center mt-3 mb-6">
          <View className="items-center px-6">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {streak}
              </Text>
              <Text className="ml-1 text-lg">🔥</Text>
            </View>
            <Text className="text-[10px] font-semibold tracking-widest text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
              CURRENT STREAK
            </Text>
          </View>
          <View className="w-px h-8 bg-border dark:bg-border-dark" />
          <View className="items-center px-6">
            <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
              {totalCompletions}
            </Text>
            <Text className="text-[10px] font-semibold tracking-widest text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
              TOTAL COMPLETIONS
            </Text>
          </View>
        </View>

        {/* Circular progress */}
        <View className="items-center py-4">
          <CircularProgress
            completed={sessionsCompleted}
            total={sessionsTotal}
            color={habit.color}
          />
        </View>

        {/* Complete Session button */}
        <View className="px-5 mt-4 mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!isCompletedToday) checkIn(habitId);
            }}
            className="rounded-2xl py-4 items-center"
            style={{
              backgroundColor: isCompletedToday ? '#A3A3A3' : habit.color,
            }}
          >
            <Text className="text-base font-semibold text-white">
              {isCompletedToday ? 'Completed' : 'Complete Session'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Last 14 Days */}
        <View className="mx-5 p-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs font-bold tracking-widest text-foreground dark:text-foreground-dark">
              LAST 14 DAYS
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {successRate}% Success
            </Text>
          </View>

          {/* Day labels */}
          <View className="flex-row justify-between mb-2 px-1">
            {DAY_LABELS.map((d, i) => (
              <View key={i} className="w-9 items-center">
                <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Week 1 (days 0-6) */}
          <View className="flex-row justify-between mb-2 px-1">
            {history.slice(0, 7).map((status, i) => (
              <View key={i} className="w-9 h-9 items-center justify-center">
                {status === 'done' ? (
                  <View
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: habit.color }}
                  >
                    <View className="w-2.5 h-2.5 rounded-full bg-white" />
                  </View>
                ) : (
                  <View className="w-7 h-7 rounded-full border-[1.5px] border-destructive" />
                )}
              </View>
            ))}
          </View>

          {/* Week 2 (days 7-13) */}
          <View className="flex-row justify-between mb-3 px-1">
            {history.slice(7, 14).map((status, i) => (
              <View key={i} className="w-9 h-9 items-center justify-center">
                {i === 6 ? (
                  // Today marker
                  status === 'done' ? (
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center border-[1.5px]"
                      style={{ backgroundColor: habit.color, borderColor: habit.color }}
                    >
                      <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    </View>
                  ) : (
                    <View
                      className="w-7 h-7 rounded-full border-[1.5px] border-dashed items-center justify-center"
                      style={{ borderColor: habit.color }}
                    >
                      <Text style={{ color: habit.color, fontSize: 7, fontWeight: '700', letterSpacing: 0.5 }}>
                        TODAY
                      </Text>
                    </View>
                  )
                ) : status === 'done' ? (
                  <View
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: habit.color }}
                  >
                    <View className="w-2.5 h-2.5 rounded-full bg-white" />
                  </View>
                ) : (
                  <View className="w-7 h-7 rounded-full border-[1.5px] border-destructive" />
                )}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View className="flex-row items-center justify-center gap-5">
            <View className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: habit.color }}
              />
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark font-medium">
                DONE
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full border border-destructive mr-1.5" />
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark font-medium">
                MISSED
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
