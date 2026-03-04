import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHabitStore } from '../stores/habitStore';
import { getEntriesInRange, getEntriesByHabitAndRange } from '../services/database';

// ─── Helpers ───────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Mon=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDate(monday), end: formatDate(sunday) };
}

// ─── Animated Progress Bar ─────────────────────────────

function AnimatedBar({ percent, delay = 0 }: { percent: number; delay?: number }) {
  const width = useSharedValue(0);
  React.useEffect(() => {
    const t = setTimeout(() => {
      width.value = withSpring(percent, { damping: 18, stiffness: 90, mass: 0.8 });
    }, delay);
    return () => clearTimeout(t);
  }, [percent]);

  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View className="h-2 bg-secondary dark:bg-secondary-dark rounded-full overflow-hidden">
      <Animated.View className="h-full bg-primary dark:bg-primary-dark rounded-full" style={style} />
    </View>
  );
}

// ─── Constants ─────────────────────────────────────────

const NUM_WEEKS = 12;
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const LABEL_W = 22;
const CELL_GAP = 3;

// ─── Screen ────────────────────────────────────────────

export function StatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { habits, todayEntries } = useHabitStore();
  const { width: screenWidth } = useWindowDimensions();

  // Cell size for GitHub-style grid
  const gridInnerWidth = screenWidth - 40 - 32 - LABEL_W - CELL_GAP;
  const cellSize = Math.floor(
    (gridInnerWidth - CELL_GAP * (NUM_WEEKS - 1)) / NUM_WEEKS
  );

  // Re-trigger entering animations on each tab focus
  const [animKey, setAnimKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setAnimKey((k) => k + 1);
    }, [])
  );

  const stats = useMemo(() => {
    const today = formatDate(new Date());
    const { start: weekStart, end: weekEnd } = getWeekRange();
    const fourteenDaysAgo = formatDate(daysAgo(13));

    // All entries this week
    const weekEntries = getEntriesInRange(weekStart, weekEnd);
    // All entries last 14 days
    const recentEntries = getEntriesInRange(fourteenDaysAgo, today);

    // ── Weekly completion ──
    // Count days elapsed in the week so far (Mon=1)
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Mon=1..Sun=7
    const totalPossible = habits.length * dayOfWeek;
    // Unique (habitId, date) combos this week
    const weekCompletions = new Set(weekEntries.map((e) => `${e.habitId}_${e.date}`)).size;
    const weekPercent = totalPossible > 0 ? Math.round((weekCompletions / totalPossible) * 100) : 0;

    // ── Completion rate (14 days) ──
    const totalPossible14 = habits.length * 14;
    const completions14 = new Set(recentEntries.map((e) => `${e.habitId}_${e.date}`)).size;
    const completionRate = totalPossible14 > 0 ? Math.round((completions14 / totalPossible14) * 100) : 0;

    // ── Week-over-week change ──
    const prevWeekStart = formatDate(daysAgo(dayOfWeek + 6));
    const prevWeekEnd = formatDate(daysAgo(dayOfWeek));
    const prevWeekEntries = getEntriesInRange(prevWeekStart, prevWeekEnd);
    const prevWeekCompletions = new Set(prevWeekEntries.map((e) => `${e.habitId}_${e.date}`)).size;
    const prevTotalPossible = habits.length * 7;
    const prevPercent = prevTotalPossible > 0 ? Math.round((prevWeekCompletions / prevTotalPossible) * 100) : 0;
    const weekChange = completionRate - prevPercent;

    // ── Streaks ──
    let longestStreak = 0;
    let currentStreak = 0;

    if (habits.length > 0) {
      // Current streak: consecutive days where all habits were completed
      let day = new Date();
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const dateStr = formatDate(day);
        const dayEntries = recentEntries.length > 0 || i < 14
          ? getEntriesInRange(dateStr, dateStr)
          : [];
        const completedHabits = new Set(dayEntries.map((e) => e.habitId));
        const allDone = habits.every((h) => completedHabits.has(h.id));
        if (allDone && habits.length > 0) {
          streak++;
        } else if (i > 0) {
          break; // streak broken
        } else {
          // today not done yet, check from yesterday
          day.setDate(day.getDate() - 1);
          continue;
        }
        day.setDate(day.getDate() - 1);
      }
      currentStreak = streak;

      // Longest streak (scan 90 days)
      let best = 0;
      let run = 0;
      for (let i = 89; i >= 0; i--) {
        const dateStr = formatDate(daysAgo(i));
        const dayEntries = getEntriesInRange(dateStr, dateStr);
        const completedHabits = new Set(dayEntries.map((e) => e.habitId));
        const allDone = habits.every((h) => completedHabits.has(h.id));
        if (allDone && habits.length > 0) {
          run++;
          best = Math.max(best, run);
        } else {
          run = 0;
        }
      }
      longestStreak = best;
    }

    // ── Activity grid (GitHub-style, 12 weeks) ──
    const todayDate = new Date();
    const todayDow = todayDate.getDay(); // 0=Sun
    const monOffset = todayDow === 0 ? 6 : todayDow - 1; // Mon=0
    const currentMon = new Date(todayDate);
    currentMon.setDate(todayDate.getDate() - monOffset);
    const gridStartDate = new Date(currentMon);
    gridStartDate.setDate(currentMon.getDate() - (NUM_WEEKS - 1) * 7);
    const gridStartStr = formatDate(gridStartDate);
    const gridEntries = getEntriesInRange(gridStartStr, today);

    const activityColumns: { date: string; ratio: number; empty: boolean }[][] = [];
    for (let w = 0; w < NUM_WEEKS; w++) {
      const week: { date: string; ratio: number; empty: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(gridStartDate);
        dayDate.setDate(gridStartDate.getDate() + w * 7 + d);
        const dateStr = formatDate(dayDate);
        const isFuture = dateStr > today;
        if (isFuture) {
          week.push({ date: dateStr, ratio: 0, empty: true });
        } else {
          const dayCompletions = new Set(
            gridEntries.filter((e) => e.date === dateStr).map((e) => e.habitId)
          ).size;
          const ratio = habits.length > 0 ? dayCompletions / habits.length : 0;
          week.push({ date: dateStr, ratio, empty: false });
        }
      }
      activityColumns.push(week);
    }

    // Month labels for the grid
    const monthLabels: { label: string; colIndex: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;
    for (let w = 0; w < NUM_WEEKS; w++) {
      const firstDateInWeek = activityColumns[w][0].date;
      const m = new Date(firstDateInWeek + 'T00:00:00').getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: months[m], colIndex: w });
        lastMonth = m;
      }
    }

    // ── Per-habit performance (last 4 weeks) ──
    const fourWeeksAgo = formatDate(daysAgo(27));
    const habitPerformance = habits.map((h) => {
      // Start date is the later of: 4 weeks ago or habit creation date
      const createdDate = h.createdAt.split('T')[0];
      const startDate = createdDate > fourWeeksAgo ? createdDate : fourWeeksAgo;
      const entries = getEntriesByHabitAndRange(h.id, startDate, today);
      const completedDays = new Set(entries.map((e) => e.date)).size;
      // Days since start (inclusive)
      const msPerDay = 86400000;
      const expectedDays = Math.max(1, Math.floor(
        (new Date(today + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / msPerDay
      ) + 1);
      const rate = Math.round((completedDays / expectedDays) * 100);
      return { id: h.id, name: h.name, icon: h.icon, color: h.color, rate, completedDays, expectedDays };
    });

    return {
      weekPercent,
      completionRate,
      weekChange,
      longestStreak,
      currentStreak,
      activityColumns,
      monthLabels,
      habitPerformance,
    };
  }, [habits, todayEntries]);

  const encouragement =
    stats.weekPercent >= 80
      ? "Keep up the good work! You're on track."
      : stats.weekPercent >= 50
      ? "Good progress! Push a little harder."
      : stats.weekPercent > 0
      ? "Every day is a chance to build momentum."
      : "Start tracking your habits today!";

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView
        key={animKey}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-5 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Statistics
          </Text>
        </Animated.View>

        {/* ── Weekly Progress Card ── */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          className="mx-5 mt-4 p-5 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              Weekly Progress
            </Text>
            <Text className="text-3xl font-bold text-primary dark:text-primary-dark">
              {stats.weekPercent}%
            </Text>
          </View>
          <View className="mb-3">
            <AnimatedBar percent={stats.weekPercent} delay={200} />
          </View>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {encouragement}
          </Text>
        </Animated.View>

        {/* ── Completion + Streak Row ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} className="flex-row mx-5 mt-4" style={{ gap: 12 }}>
          {/* Completion */}
          <View className="flex-1 p-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-done" size={18} color={isDark ? '#EBEBEB' : '#141414'} />
              <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark ml-1.5">
                Completion
              </Text>
            </View>
            <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">
              {stats.completionRate}%
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons
                name={stats.weekChange >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={stats.weekChange >= 0 ? '#22C55E' : '#EF4444'}
              />
              <Text
                className="text-xs font-medium ml-1"
                style={{ color: stats.weekChange >= 0 ? '#22C55E' : '#EF4444' }}
              >
                {stats.weekChange >= 0 ? '+' : ''}{stats.weekChange}% this week
              </Text>
            </View>
          </View>

          {/* Longest Streak */}
          <View className="flex-1 p-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark">
            <View className="flex-row items-center mb-2">
              <Ionicons name="flame" size={18} color="#F97316" />
              <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark ml-1.5">
                Longest Streak
              </Text>
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">
                {stats.longestStreak}
              </Text>
              <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark ml-1">
                days
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-1">
              Current: {stats.currentStreak} days
            </Text>
          </View>
        </Animated.View>

        {/* ── Activity Grid (GitHub-style) ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} className="mx-5 mt-4">
          <View className="p-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark">
            <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-3">
              Activity
            </Text>
            <View className="flex-row">
              {/* Weekday labels */}
              <View style={{ width: LABEL_W, marginRight: CELL_GAP }}>
                {WEEKDAY_LABELS.map((d, i) => (
                  <View
                    key={d}
                    style={{
                      height: cellSize,
                      marginBottom: i < 6 ? CELL_GAP : 0,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      className="text-muted-foreground dark:text-muted-foreground-dark"
                      style={{ fontSize: 10 }}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>
              {/* Week columns */}
              {stats.activityColumns.map((week, wi) => (
                <View
                  key={wi}
                  style={{
                    marginRight: wi < stats.activityColumns.length - 1 ? CELL_GAP : 0,
                  }}
                >
                  {week.map((day, di) => {
                    const opacity = day.empty
                      ? 0
                      : day.ratio === 0
                      ? 0.08
                      : 0.15 + day.ratio * 0.85;
                    return (
                      <View
                        key={day.date}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          marginBottom: di < 6 ? CELL_GAP : 0,
                          borderRadius: 3,
                          backgroundColor: day.empty
                            ? 'transparent'
                            : isDark
                            ? `rgba(235, 235, 235, ${opacity})`
                            : `rgba(20, 20, 20, ${opacity})`,
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
            {/* Month labels */}
            <View style={{ height: 16, marginTop: 4 }}>
              {stats.monthLabels.map((ml) => (
                <Text
                  key={`${ml.label}-${ml.colIndex}`}
                  className="text-muted-foreground dark:text-muted-foreground-dark"
                  style={{
                    fontSize: 10,
                    position: 'absolute',
                    left: LABEL_W + CELL_GAP + ml.colIndex * (cellSize + CELL_GAP),
                  }}
                >
                  {ml.label}
                </Text>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Habit Performance ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} className="mx-5 mt-4">
          <View className="rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark overflow-hidden">
            <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark px-4 pt-4 pb-2">
              Habit Performance
            </Text>
            {stats.habitPerformance.map((hp, i) => (
              <View
                key={hp.id}
                className={`flex-row items-center p-4 ${
                  i < stats.habitPerformance.length - 1 ? 'border-b border-border dark:border-border-dark' : ''
                }`}
              >
                {/* Icon */}
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: hp.color + '20' }}
                >
                  <Ionicons name={hp.icon as any} size={20} color={hp.color} />
                </View>

                {/* Name + bar */}
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                      {hp.name}
                    </Text>
                    <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
                      {hp.rate}%
                    </Text>
                  </View>
                  <View className="h-1.5 bg-secondary dark:bg-secondary-dark rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${hp.rate}%`, backgroundColor: hp.color }}
                    />
                  </View>
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-1">
                    {hp.completedDays}/{hp.expectedDays} days
                  </Text>
                </View>
              </View>
            ))}

            {stats.habitPerformance.length === 0 && (
              <View className="p-8 items-center">
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  No habits yet. Create one to see stats!
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
