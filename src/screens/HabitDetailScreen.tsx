import React, { useEffect, useMemo } from 'react';
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
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useHabitStore, isRestDay } from '../stores/habitStore';
import { getEntriesByHabitAndRange } from '../services/database';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useI18n } from '../i18n';

type DetailRoute = RouteProp<RootStackParamList, 'HabitDetail'>;

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** A single calendar day cell */
type CalendarDay = {
  date: string;
  day: number;
  status: 'done' | 'missed' | 'future' | 'before' | 'rest';
  isToday: boolean;
};

const WEEKDAY_LABELS_FALLBACK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTH_NAMES_FALLBACK = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Build a full monthly calendar for the current month */
function buildMonthCalendar(
  habitId: string,
  createdAt: string,
  frequency?: { type: string; daysOfWeek?: number[] },
  monthNames: readonly string[] = MONTH_NAMES_FALLBACK,
): { days: (CalendarDay | null)[]; monthLabel: string; successRate: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = formatDate(now);
  const createdDate = (createdAt || '').split('T')[0];

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (firstDay.getDay() + 6) % 7; // 0=Mon

  const monthStart = formatDate(firstDay);
  const monthEnd = formatDate(new Date(year, month, daysInMonth));
  const entries = getEntriesByHabitAndRange(habitId, monthStart, monthEnd);
  const completedDates = new Set(entries.map((e) => e.date));

  const days: (CalendarDay | null)[] = [];

  // leading blank cells
  for (let i = 0; i < firstDow; i++) days.push(null);

  let doneCount = 0;
  let expectedCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d));
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isBefore = dateStr < createdDate;

    const dayDate = new Date(year, month, d);
    const rest = frequency ? isRestDay(frequency, dayDate) : false;

    let status: CalendarDay['status'];
    if (isFuture) {
      status = 'future';
    } else if (isBefore) {
      status = 'before';
    } else if (completedDates.has(dateStr)) {
      status = 'done';
      doneCount++;
      expectedCount++;
    } else if (rest) {
      status = 'rest';
      // Rest days don't count toward expected or missed
    } else {
      status = 'missed';
      expectedCount++;
    }

    days.push({ date: dateStr, day: d, status, isToday });
  }

  // trailing blank cells to fill last row
  while (days.length % 7 !== 0) days.push(null);

  return {
    days,
    monthLabel: `${monthNames[month]} ${year}`,
    successRate: expectedCount > 0 ? Math.round((doneCount / expectedCount) * 100) : 0,
  };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Circular progress component with ring animation
function CircularProgress({
  completed,
  total,
  color,
  size = 180,
  strokeWidth = 12,
  last30DaysLabel = 'LAST 30 DAYS',
}: {
  completed: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  last30DaysLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

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
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text */}
      <View className="absolute items-center">
        <Text className="text-[42px] font-bold text-foreground dark:text-foreground-dark">
          {total > 0 ? Math.round((completed / total) * 100) : 0}<Text className="text-2xl text-muted-foreground dark:text-muted-foreground-dark font-light">%</Text>
        </Text>
        <Text className="text-xs font-semibold tracking-widest text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
          {last30DaysLabel}
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
  const { t } = useI18n();

  // Monthly calendar data
  const calendar = useMemo(
    () => buildMonthCalendar(habitId, habit?.createdAt || '', habit?.frequency, t.monthNames),
    [habitId, habit, todayEntries, t],
  );

  const streak = useMemo(() => {
    // Count consecutive days completed going backward from today (skip rest days)
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(d);
      // Skip rest days — they don't break or count toward streak
      if (habit?.frequency && isRestDay(habit.frequency, new Date(d))) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      const entries = getEntriesByHabitAndRange(habitId, dateStr, dateStr);
      if (entries.length > 0) {
        count++;
      } else if (i === 0) {
        // Today not yet done — check from yesterday
        d.setDate(d.getDate() - 1);
        continue;
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [habitId, habit, todayEntries]);

  const totalCompletions = useMemo(() => {
    // All-time completions for this habit
    const entries = getEntriesByHabitAndRange(habitId, '2000-01-01', formatDate(new Date()));
    return new Set(entries.map((e) => e.date)).size;
  }, [habitId, todayEntries]);

  const today = formatDate(new Date());
  const isCompletedToday = todayEntries.some(
    (e) => e.habitId === habitId && e.date === today,
  );

  // 30-day completion rate (excluding rest days)
  const thirtyDayRate = useMemo(() => {
    const todayStr = formatDate(new Date());
    const thirtyAgo = formatDate(daysAgo(29));
    const createdDate = (habit?.createdAt || '').split('T')[0];
    const effectiveStart = createdDate > thirtyAgo ? createdDate : thirtyAgo;
    if (effectiveStart > todayStr) return { completed: 0, total: 0, percent: 0 };
    const msPerDay = 86400000;
    const totalDays = Math.max(1, Math.floor(
      (new Date(todayStr + 'T00:00:00').getTime() - new Date(effectiveStart + 'T00:00:00').getTime()) / msPerDay
    ) + 1);

    // Count only active days (exclude rest days based on frequency)
    let activeDays = 0;
    const freq = habit?.frequency;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(new Date(effectiveStart + 'T00:00:00').getTime() + i * msPerDay);
      const dow = d.getDay() || 7; // Convert JS 0=Sun to ISO 7=Sun (Mon=1..Sun=7)
      if (freq && (freq.type === 'weekly' || freq.type === 'custom') && freq.daysOfWeek && freq.daysOfWeek.length > 0) {
        if (!freq.daysOfWeek.includes(dow)) continue; // rest day
      }
      activeDays++;
    }

    const expectedDays = Math.max(1, activeDays);
    const entries = getEntriesByHabitAndRange(habitId, effectiveStart, todayStr);
    const completedDays = new Set(entries.map((e) => e.date)).size;
    const percent = Math.round((completedDays / expectedDays) * 100);
    return { completed: completedDays, total: expectedDays, percent };
  }, [habitId, habit, todayEntries]);

  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <Text className="text-muted-foreground dark:text-muted-foreground-dark">{t.habitNotFound}</Text>
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
          {t.details}
        </Text>
        <TouchableOpacity
          hitSlop={12}
          onPress={() =>
            (navigation as any).navigate('NewHabit', { editHabitId: habitId })
          }
        >
          <Text className="text-base font-medium" style={{ color: habit.color }}>
            {t.edit}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Name */}
        <Animated.View entering={FadeInDown.duration(400)} className="items-center pt-4 pb-2">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: habit.color + '1A' }}
          >
            <Ionicons name={habit.icon as any} size={36} color={habit.color} />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {habit.name}
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} className="flex-row items-center justify-center mt-3 mb-6">
          <View className="items-center px-6">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {streak}
              </Text>
              <Ionicons name="flame" size={20} color="#F97316" style={{ marginLeft: 2 }} />
            </View>
            <Text className="text-[10px] font-semibold tracking-widest text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
              {t.currentStreak}
            </Text>
          </View>
          <View className="w-px h-8 bg-border dark:bg-border-dark" />
          <View className="items-center px-6">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {totalCompletions}
              </Text>
              <Ionicons name="trophy-sharp" size={20} color="#F59E0B" style={{ marginLeft: 2 }} />
            </View>
            <Text className="text-[10px] font-semibold tracking-widest text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
              {t.totalCompletions}
            </Text>
          </View>
        </Animated.View>

        {/* Circular progress — 30-day completion rate */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} className="items-center py-4">
          <CircularProgress
            completed={thirtyDayRate.completed}
            total={thirtyDayRate.total}
            color={habit.color}
            last30DaysLabel={t.last30Days}
          />
        </Animated.View>

        {/* Monthly Calendar */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} className="mx-5 px-4 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs font-bold tracking-widest text-foreground dark:text-foreground-dark">
              {calendar.monthLabel.toUpperCase()}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {calendar.successRate}{t.successPercent}
            </Text>
          </View>

          {/* Weekday headers */}
          <View className="flex-row mb-1">
            {t.weekdayHeaders.map((d, i) => (
              <View key={i} style={{ flex: 1 }} className="items-center py-1">
                <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          {Array.from(
            { length: Math.ceil(calendar.days.length / 7) },
            (_, row) => (
              <View key={row} className="flex-row">
                {calendar.days.slice(row * 7, row * 7 + 7).map((cell, col) => (
                  <View
                    key={col}
                    style={{ flex: 1 }}
                    className="items-center justify-center py-[5px]"
                  >
                    {cell == null ? (
                      <View className="w-8 h-8" />
                    ) : cell.status === 'done' ? (
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: habit.color,
                          borderWidth: cell.isToday ? 2 : 0,
                          borderColor: cell.isToday ? isDark ? '#FAFAFA' : '#0A0A0A' : undefined,
                        }}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {cell.day}
                        </Text>
                      </View>
                    ) : cell.status === 'missed' ? (
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          borderWidth: cell.isToday ? 1.5 : 0,
                          borderColor: cell.isToday ? (isDark ? '#FAFAFA' : '#0A0A0A') : undefined,
                        }}
                      >
                        <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
                          {cell.day}
                        </Text>
                      </View>
                    ) : cell.status === 'rest' ? (
                      /* rest day — subtle muted dot */
                      <View className="w-8 h-8 rounded-full items-center justify-center opacity-40">
                        <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                          {cell.day}
                        </Text>
                      </View>
                    ) : (
                      /* future or before creation */
                      <View className="w-8 h-8 rounded-full items-center justify-center opacity-30">
                        <Text className="text-xs font-medium text-foreground dark:text-foreground-dark">
                          {cell.day}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ),
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
