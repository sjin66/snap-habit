import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  PanResponder,
  Alert,
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
import { getEntriesByHabitAndRange, generateId, insertEntry, updateHabitCreatedAtInDB } from '../services/database';
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
  status: 'done' | 'missed' | 'future' | 'before' | 'rest' | 'skipped';
  isToday: boolean;
};

const WEEKDAY_LABELS_FALLBACK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTH_NAMES_FALLBACK = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toMonthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

function fromMonthIndex(index: number): { year: number; month: number } {
  return { year: Math.floor(index / 12), month: index % 12 };
}

function toDateOnly(value?: string): string | undefined {
  if (!value) return undefined;
  const dateOnly = value.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
  return undefined;
}

/** Build a full monthly calendar for a specific month */
function buildMonthCalendar(
  habitId: string,
  createdAt: string,
  monthIndex: number,
  activeEndAt?: string,
  frequency?: { type: string; daysOfWeek?: number[] },
  monthNames: readonly string[] = MONTH_NAMES_FALLBACK,
): { days: (CalendarDay | null)[]; monthLabel: string; successRate: number } {
  const { year, month } = fromMonthIndex(monthIndex);
  const todayStr = formatDate(new Date());
  const createdDate = (createdAt || '').split('T')[0];
  const activeEndDate = activeEndAt || todayStr;

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (firstDay.getDay() + 6) % 7; // 0=Mon

  const monthStart = formatDate(firstDay);
  const monthEnd = formatDate(new Date(year, month, daysInMonth));
  const entries = getEntriesByHabitAndRange(habitId, monthStart, monthEnd);
  const completedDates = new Set(entries.filter((e) => e.status !== 'skipped').map((e) => e.date));
  const skippedDates = new Set(entries.filter((e) => e.status === 'skipped').map((e) => e.date));

  const days: (CalendarDay | null)[] = [];

  // leading blank cells
  for (let i = 0; i < firstDow; i++) days.push(null);

  let doneCount = 0;
  let expectedCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d));
    const isToday = dateStr === todayStr && dateStr <= activeEndDate;
    const isFuture = dateStr > todayStr || dateStr > activeEndDate;
    const isBefore = dateStr < createdDate;

    const dayDate = new Date(year, month, d);
    const dayHasEntry = completedDates.has(dateStr) || skippedDates.has(dateStr);
    const rest = frequency ? isRestDay(frequency, dayDate, dayHasEntry) : false;

    let status: CalendarDay['status'];
    if (isFuture) {
      status = 'future';
    } else if (isBefore) {
      status = 'before';
    } else if (completedDates.has(dateStr)) {
      status = 'done';
      doneCount++;
      expectedCount++;
    } else if (skippedDates.has(dateStr)) {
      status = 'skipped';
      // Skipped days don't count toward expected or done
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
    successRate: expectedCount > 0 ? Math.min(100, Math.round((doneCount / expectedCount) * 100)) : 0,
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
          {total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0}<Text className="text-2xl text-muted-foreground dark:text-muted-foreground-dark font-light">%</Text>
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

  const { habits, todayEntries, checkIn, initialize } = useHabitStore();
  const habit = habits.find((h) => h.id === habitId);
  const { t } = useI18n();

  const createdDateOnly = toDateOnly(habit?.createdAt) || formatDate(new Date());
  const activeEndDateOnly = useMemo(() => {
    const todayOnly = formatDate(new Date());
    const archiveDate = toDateOnly(habit?.archivedAt);
    const deletedDate = toDateOnly(habit?.deletedAt);
    const candidates = [todayOnly, archiveDate, deletedDate].filter(Boolean) as string[];
    return candidates.reduce((min, curr) => (curr < min ? curr : min), todayOnly);
  }, [habit?.archivedAt, habit?.deletedAt]);

  const minMonthIndex = useMemo(() => toMonthIndex(new Date(`${createdDateOnly}T00:00:00`)), [createdDateOnly]);
  const maxMonthIndex = useMemo(() => toMonthIndex(new Date(`${activeEndDateOnly}T00:00:00`)), [activeEndDateOnly]);
  const [monthIndex, setMonthIndex] = useState(maxMonthIndex);

  useEffect(() => {
    setMonthIndex((prev) => Math.max(minMonthIndex, Math.min(maxMonthIndex, prev)));
  }, [minMonthIndex, maxMonthIndex]);

  const canGoPrevMonth = monthIndex > minMonthIndex;
  const canGoNextMonth = monthIndex < maxMonthIndex;

  const goPrevMonth = useCallback(() => {
    if (!canGoPrevMonth) return;
    setMonthIndex((prev) => prev - 1);
  }, [canGoPrevMonth]);

  const goNextMonth = useCallback(() => {
    if (!canGoNextMonth) return;
    setMonthIndex((prev) => prev + 1);
  }, [canGoNextMonth]);

  const calendarPanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 8,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -40) {
          goNextMonth();
          return;
        }
        if (gestureState.dx >= 40) {
          goPrevMonth();
        }
      },
    }),
    [goNextMonth, goPrevMonth],
  );

  const seedHistoryForTesting = useCallback(() => {
    if (!habit) return;

    Alert.alert(
      'Seed 90 days test data?',
      'This will adjust created date and overwrite existing entries for this habit within 90 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          style: 'destructive',
          onPress: () => {
            const days = 90;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - (days - 1));
            startDate.setHours(9, 0, 0, 0);

            updateHabitCreatedAtInDB(habitId, startDate.toISOString());

            for (let i = 0; i < days; i++) {
              const d = new Date(startDate);
              d.setDate(startDate.getDate() + i);
              const date = formatDate(d);
              const roll = Math.random();

              if (roll < 0.68) {
                const completedAt = new Date(d);
                completedAt.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
                insertEntry({
                  id: generateId(),
                  habitId,
                  date,
                  completedAt: completedAt.toISOString(),
                  status: 'completed',
                });
              } else if (roll < 0.82) {
                const skippedAt = new Date(d);
                skippedAt.setHours(20, 0, 0, 0);
                insertEntry({
                  id: generateId(),
                  habitId,
                  date,
                  completedAt: skippedAt.toISOString(),
                  status: 'skipped',
                });
              }
            }

            initialize();
          },
        },
      ],
    );
  }, [habit, habitId, initialize]);

  // Monthly calendar data
  const calendar = useMemo(
    () => buildMonthCalendar(
      habitId,
      habit?.createdAt || '',
      monthIndex,
      activeEndDateOnly,
      habit?.frequency,
      t.monthNames,
    ),
    [habitId, habit, todayEntries, t, monthIndex, activeEndDateOnly],
  );

  const streak = useMemo(() => {
    // Batch query: fetch all entries for this habit in one go
    const streakStartDate = new Date();
    streakStartDate.setDate(streakStartDate.getDate() - 365);
    const allEntries = getEntriesByHabitAndRange(habitId, formatDate(streakStartDate), formatDate(new Date()));
    const entryByDate = new Map<string, typeof allEntries>();
    for (const e of allEntries) {
      const list = entryByDate.get(e.date) || [];
      list.push(e);
      entryByDate.set(e.date, list);
    }

    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDate(d);
      const dayEntries = entryByDate.get(dateStr) || [];
      const dayHasEntry = dayEntries.length > 0;
      if (habit?.frequency && isRestDay(habit.frequency, new Date(d), dayHasEntry)) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      const hasCompleted = dayEntries.some((e) => e.status !== 'skipped');
      const hasSkipped = dayEntries.some((e) => e.status === 'skipped');
      if (hasCompleted) {
        count++;
      } else if (hasSkipped) {
        d.setDate(d.getDate() - 1);
        continue;
      } else if (i === 0) {
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
    // All-time completions for this habit (exclude skipped)
    const entries = getEntriesByHabitAndRange(habitId, '2000-01-01', formatDate(new Date()));
    return new Set(entries.filter((e) => e.status !== 'skipped').map((e) => e.date)).size;
  }, [habitId, todayEntries]);

  const today = formatDate(new Date());
  const isCompletedToday = todayEntries.some(
    (e) => e.habitId === habitId && e.date === today,
  );

  // 30-day completion rate (excluding rest days, respecting historical entries)
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

    const entries = getEntriesByHabitAndRange(habitId, effectiveStart, todayStr);
    const entryDates = new Set(entries.map((e) => e.date));
    const completedDays = new Set(entries.filter((e) => e.status !== 'skipped').map((e) => e.date)).size;
    const skippedDays = new Set(entries.filter((e) => e.status === 'skipped').map((e) => e.date)).size;

    // Count only active days (exclude rest days, but days with entries are always active)
    let activeDays = 0;
    const freq = habit?.frequency;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(new Date(effectiveStart + 'T00:00:00').getTime() + i * msPerDay);
      const dateStr = formatDate(d);
      const dayHasEntry = entryDates.has(dateStr);
      if (freq && isRestDay(freq, d, dayHasEntry)) continue;
      activeDays++;
    }

    const expectedDays = Math.max(1, activeDays);
    const percent = Math.min(100, Math.round((completedDays / Math.max(1, expectedDays - skippedDays)) * 100));
    return { completed: completedDays, total: Math.max(1, expectedDays - skippedDays), percent };
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
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          className="mx-5 px-4 pt-4"
          {...calendarPanResponder.panHandlers}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={goPrevMonth} disabled={!canGoPrevMonth} hitSlop={8}>
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={!canGoPrevMonth ? (isDark ? '#525252' : '#CFCFCF') : (isDark ? '#FAFAFA' : '#0A0A0A')}
                />
              </TouchableOpacity>
              <Text className="text-xs font-bold tracking-widest text-foreground dark:text-foreground-dark mx-2">
                {calendar.monthLabel.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={goNextMonth} disabled={!canGoNextMonth} hitSlop={8}>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={!canGoNextMonth ? (isDark ? '#525252' : '#CFCFCF') : (isDark ? '#FAFAFA' : '#0A0A0A')}
                />
              </TouchableOpacity>
            </View>
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
                      /* rest day — dashed border */
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          borderWidth: 1.5,
                          borderStyle: 'dashed',
                          borderColor: isDark ? '#555' : '#C0C0C0',
                          opacity: cell.isToday ? 1 : 0.7,
                        }}
                      >
                        <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                          {cell.day}
                        </Text>
                      </View>
                    ) : cell.status === 'skipped' ? (
                      /* skipped day — amber indicator */
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: '#F59E0B30',
                          borderWidth: cell.isToday ? 1.5 : 0,
                          borderColor: cell.isToday ? '#F59E0B' : undefined,
                        }}
                      >
                        <Text className="text-xs font-medium" style={{ color: '#F59E0B' }}>
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

          {/* Legend */}
          <View className="flex-row flex-wrap mt-4 gap-x-4 gap-y-2 justify-center">
            {/* Done */}
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: habit.color }} />
              <Text className="text-[11px] text-muted-foreground dark:text-muted-foreground-dark">{t.legendDone}</Text>
            </View>
            {/* Missed */}
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-1.5 border" style={{ borderColor: isDark ? '#555' : '#C0C0C0' }} />
              <Text className="text-[11px] text-muted-foreground dark:text-muted-foreground-dark">{t.legendMissed}</Text>
            </View>
            {/* Rest */}
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-1.5" style={{ borderWidth: 1.2, borderStyle: 'dashed', borderColor: isDark ? '#555' : '#C0C0C0' }} />
              <Text className="text-[11px] text-muted-foreground dark:text-muted-foreground-dark">{t.legendRest}</Text>
            </View>
            {/* Skipped */}
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#F59E0B30' }} />
              <Text className="text-[11px] text-muted-foreground dark:text-muted-foreground-dark">{t.legendSkipped}</Text>
            </View>
          </View>

          {__DEV__ && (
            <View className="mt-4 items-center">
              <TouchableOpacity
                onPress={seedHistoryForTesting}
                activeOpacity={0.8}
                className="px-4 py-2 rounded-full border border-border dark:border-border-dark"
              >
                <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                  Seed 90d test data
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
