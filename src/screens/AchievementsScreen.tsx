import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, useColorScheme, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useHabitStore, isRestDay } from '../stores/habitStore';
import {
  getEntriesInRange,
  getAllHabitsForStats,
  getTotalCompletedEntries,
  getDistinctActiveDays,
  getTotalHabitsCreated,
} from '../services/database';
import { useI18n } from '../i18n';

// ─── Types ─────────────────────────────────────────────

type AchievementCategory = 'streak' | 'checkins' | 'habits' | 'perfect' | 'active';

interface AchievementDef {
  id: string;
  category: AchievementCategory;
  emoji: string;
  nameKey: string;
  descKey: string;
  threshold: number;
  getValue: (data: AchievementData) => number;
}

interface AchievementData {
  longestStreak: number;
  totalCheckins: number;
  totalHabits: number;
  perfectDays: number;
  activeDays: number;
}

interface ComputedAchievement {
  def: AchievementDef;
  current: number;
  unlocked: boolean;
  progress: number; // 0–1
}

// ─── Achievement Definitions ───────────────────────────

const ACHIEVEMENTS: AchievementDef[] = [
  // Streak
  { id: 'first_flame',   category: 'streak',   emoji: '🔥', nameKey: 'achFirstFlameName',   descKey: 'achFirstFlameDesc',   threshold: 3,   getValue: (d) => d.longestStreak },
  { id: 'on_fire',       category: 'streak',   emoji: '🔥', nameKey: 'achOnFireName',       descKey: 'achOnFireDesc',       threshold: 7,   getValue: (d) => d.longestStreak },
  { id: 'unstoppable',   category: 'streak',   emoji: '⚡', nameKey: 'achUnstoppableName',  descKey: 'achUnstoppableDesc',  threshold: 14,  getValue: (d) => d.longestStreak },
  { id: 'habit_master',  category: 'streak',   emoji: '👑', nameKey: 'achHabitMasterName',  descKey: 'achHabitMasterDesc',  threshold: 30,  getValue: (d) => d.longestStreak },
  { id: 'iron_will',     category: 'streak',   emoji: '🛡️', nameKey: 'achIronWillName',     descKey: 'achIronWillDesc',     threshold: 60,  getValue: (d) => d.longestStreak },
  { id: 'legend',        category: 'streak',   emoji: '🏆', nameKey: 'achLegendName',       descKey: 'achLegendDesc',       threshold: 100, getValue: (d) => d.longestStreak },
  // Check-ins
  { id: 'first_step',      category: 'checkins', emoji: '👣', nameKey: 'achFirstStepName',      descKey: 'achFirstStepDesc',      threshold: 1,   getValue: (d) => d.totalCheckins },
  { id: 'getting_started', category: 'checkins', emoji: '🚀', nameKey: 'achGettingStartedName', descKey: 'achGettingStartedDesc', threshold: 10,  getValue: (d) => d.totalCheckins },
  { id: 'committed',       category: 'checkins', emoji: '💪', nameKey: 'achCommittedName',      descKey: 'achCommittedDesc',      threshold: 50,  getValue: (d) => d.totalCheckins },
  { id: 'centurion',       category: 'checkins', emoji: '💯', nameKey: 'achCenturionName',      descKey: 'achCenturionDesc',      threshold: 100, getValue: (d) => d.totalCheckins },
  { id: 'dedicated',       category: 'checkins', emoji: '🌟', nameKey: 'achDedicatedName',      descKey: 'achDedicatedDesc',      threshold: 500, getValue: (d) => d.totalCheckins },
  // Habits
  { id: 'seed_planted',    category: 'habits', emoji: '🌱', nameKey: 'achSeedPlantedName',    descKey: 'achSeedPlantedDesc',    threshold: 1, getValue: (d) => d.totalHabits },
  { id: 'growing_garden',  category: 'habits', emoji: '🌿', nameKey: 'achGrowingGardenName',  descKey: 'achGrowingGardenDesc',  threshold: 3, getValue: (d) => d.totalHabits },
  { id: 'habit_forest',    category: 'habits', emoji: '🌳', nameKey: 'achHabitForestName',    descKey: 'achHabitForestDesc',    threshold: 5, getValue: (d) => d.totalHabits },
  // Perfect Days
  { id: 'perfect_day',   category: 'perfect', emoji: '⭐', nameKey: 'achPerfectDayName',   descKey: 'achPerfectDayDesc',   threshold: 1,  getValue: (d) => d.perfectDays },
  { id: 'perfect_week',  category: 'perfect', emoji: '🌟', nameKey: 'achPerfectWeekName',  descKey: 'achPerfectWeekDesc',  threshold: 7,  getValue: (d) => d.perfectDays },
  { id: 'perfect_month', category: 'perfect', emoji: '✨', nameKey: 'achPerfectMonthName', descKey: 'achPerfectMonthDesc', threshold: 30, getValue: (d) => d.perfectDays },
  // Active Days
  { id: 'week_one',  category: 'active', emoji: '📅', nameKey: 'achWeekOneName',  descKey: 'achWeekOneDesc',  threshold: 7,   getValue: (d) => d.activeDays },
  { id: 'month_one', category: 'active', emoji: '📆', nameKey: 'achMonthOneName', descKey: 'achMonthOneDesc', threshold: 30,  getValue: (d) => d.activeDays },
  { id: 'quarter',   category: 'active', emoji: '🗓️', nameKey: 'achQuarterName',  descKey: 'achQuarterDesc',  threshold: 90,  getValue: (d) => d.activeDays },
  { id: 'half_year', category: 'active', emoji: '🎯', nameKey: 'achHalfYearName', descKey: 'achHalfYearDesc', threshold: 180, getValue: (d) => d.activeDays },
];

const CATEGORY_ORDER: AchievementCategory[] = ['streak', 'checkins', 'habits', 'perfect', 'active'];

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  streak: '#EF4444',
  checkins: '#3B82F6',
  habits: '#22C55E',
  perfect: '#F59E0B',
  active: '#8B5CF6',
};

// ─── Helpers ───────────────────────────────────────────

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

// ─── Screen ────────────────────────────────────────────

export function AchievementsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { habits, todayEntries } = useHabitStore();
  const { t } = useI18n();

  const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategory>('all');
  const [filterVisible, setFilterVisible] = useState(false);

  // Re-trigger animations on each tab focus
  const [animKey, setAnimKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setAnimKey((k) => k + 1);
    }, [])
  );

  // Compute all achievement data
  const achievementData = useMemo((): AchievementData => {
    const today = formatDate(new Date());
    const yearAgo = formatDate(daysAgo(364));

    // Aggregate queries
    const totalCheckins = getTotalCompletedEntries();
    const activeDays = getDistinctActiveDays();
    const totalHabits = getTotalHabitsCreated();

    // For streaks and perfect days, use entries from last 365 days
    const allHabits = getAllHabitsForStats();
    const allEntries = getEntriesInRange(yearAgo, today);

    // Build entryMap: date → Set<habitId> (completed only)
    const completedByDate = new Map<string, Set<string>>();
    for (const e of allEntries) {
      if (e.status === 'skipped') continue;
      const set = completedByDate.get(e.date) || new Set<string>();
      set.add(e.habitId);
      completedByDate.set(e.date, set);
    }

    // Skipped by date for streak: date → Set<habitId>
    const skippedByDate = new Map<string, Set<string>>();
    for (const e of allEntries) {
      if (e.status !== 'skipped') continue;
      const set = skippedByDate.get(e.date) || new Set<string>();
      set.add(e.habitId);
      skippedByDate.set(e.date, set);
    }

    // ── Per-habit longest streak ──
    let longestStreak = 0;

    for (const habit of allHabits) {
      const createdDate = (habit.createdAt || '').split('T')[0];
      const endDate = habit.deletedAt ? habit.deletedAt.split('T')[0] : today;
      let streak = 0;
      let maxStreak = 0;
      const d = new Date(endDate + 'T00:00:00');
      const startLimit = new Date(yearAgo + 'T00:00:00');

      for (let i = 0; i < 365; i++) {
        if (d < startLimit) break;
        const dateStr = formatDate(d);
        if (dateStr < createdDate) break;

        if (habit.frequency && isRestDay(habit.frequency, new Date(d),
          (completedByDate.get(dateStr)?.has(habit.id) ?? false) || (skippedByDate.get(dateStr)?.has(habit.id) ?? false)
        )) {
          d.setDate(d.getDate() - 1);
          continue;
        }

        const completed = completedByDate.get(dateStr)?.has(habit.id) ?? false;
        const skipped = skippedByDate.get(dateStr)?.has(habit.id) ?? false;

        if (completed) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else if (skipped) {
          // Skipped doesn't break streak
          d.setDate(d.getDate() - 1);
          continue;
        } else {
          // Today tolerance: if it's today and not done yet, don't break
          if (dateStr === today && i === 0) {
            d.setDate(d.getDate() - 1);
            continue;
          }
          streak = 0;
        }

        d.setDate(d.getDate() - 1);
      }
      longestStreak = Math.max(longestStreak, maxStreak);
    }

    // ── Perfect days: days where ALL active habits were completed ──
    let perfectDays = 0;

    // Scan each day in the entry range
    const msPerDay = 86400000;
    const startDate = new Date(yearAgo + 'T00:00:00');
    const endDateObj = new Date(today + 'T00:00:00');

    for (let d = new Date(startDate); d <= endDateObj; d = new Date(d.getTime() + msPerDay)) {
      const dateStr = formatDate(d);

      // Find habits that were active on this date (created before, not deleted before, not rest day)
      const activeOnDay = allHabits.filter((h) => {
        const created = (h.createdAt || '').split('T')[0];
        if (dateStr < created) return false;
        if (h.deletedAt) {
          const deleted = h.deletedAt.split('T')[0];
          if (dateStr > deleted) return false;
        }
        const dayHasEntry = (completedByDate.get(dateStr)?.has(h.id) ?? false) || (skippedByDate.get(dateStr)?.has(h.id) ?? false);
        if (h.frequency && isRestDay(h.frequency, new Date(d), dayHasEntry)) return false;
        return true;
      });

      if (activeOnDay.length === 0) continue;

      const completedSet = completedByDate.get(dateStr);
      const skippedSet = skippedByDate.get(dateStr);
      if (!completedSet && !skippedSet) continue;

      // All active habits must be either completed or skipped
      const allDone = activeOnDay.every((h) => {
        return completedSet?.has(h.id) || skippedSet?.has(h.id);
      });

      // At least one must be actually completed (not all skipped)
      const hasCompletion = activeOnDay.some((h) => completedSet?.has(h.id));

      if (allDone && hasCompletion) perfectDays++;
    }

    return { longestStreak, totalCheckins, totalHabits, perfectDays, activeDays };
  }, [habits, todayEntries]);

  // Compute achievement states
  const computedAchievements = useMemo((): ComputedAchievement[] => {
    return ACHIEVEMENTS.map((def) => {
      const current = def.getValue(achievementData);
      const unlocked = current >= def.threshold;
      const progress = Math.min(current / def.threshold, 1);
      return { def, current, unlocked, progress };
    });
  }, [achievementData]);

  const unlockedCount = computedAchievements.filter((a) => a.unlocked).length;
  const totalCount = computedAchievements.length;

  // Group by category
  const groupedAchievements = useMemo(() => {
    const map = new Map<AchievementCategory, ComputedAchievement[]>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, computedAchievements.filter((a) => a.def.category === cat));
    }
    return map;
  }, [computedAchievements]);

  const categoryNames: Record<AchievementCategory, string> = {
    streak: t.achCatStreak,
    checkins: t.achCatCheckins,
    habits: t.achCatHabits,
    perfect: t.achCatPerfect,
    active: t.achCatActive,
  };

  const filterTabs: { key: 'all' | AchievementCategory; label: string; color: string }[] = [
    { key: 'all', label: t.achCatAll, color: '#F59E0B' },
    ...CATEGORY_ORDER.map((cat) => ({ key: cat as AchievementCategory, label: categoryNames[cat], color: CATEGORY_COLORS[cat] })),
  ];

  const visibleCategories = selectedCategory === 'all' ? CATEGORY_ORDER : [selectedCategory];

  let animDelay = 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      {/* Header — fixed */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          {t.achievements}
        </Text>
        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: selectedCategory === 'all'
              ? (isDark ? '#333' : '#E0E0E0')
              : (filterTabs.find(t => t.key === selectedCategory)?.color || '#F59E0B'),
            backgroundColor: selectedCategory === 'all'
              ? 'transparent'
              : (filterTabs.find(t => t.key === selectedCategory)?.color || '#F59E0B') + '18',
          }}
        >
          <Ionicons
            name="filter"
            size={16}
            color={selectedCategory === 'all'
              ? (isDark ? '#999' : '#666')
              : (filterTabs.find(t => t.key === selectedCategory)?.color || '#F59E0B')}
          />
          <Text
            style={{
              marginLeft: 4,
              fontSize: 13,
              fontWeight: selectedCategory === 'all' ? '400' : '600',
              color: selectedCategory === 'all'
                ? (isDark ? '#999' : '#666')
                : (filterTabs.find(t => t.key === selectedCategory)?.color || '#F59E0B'),
            }}
          >
            {filterTabs.find(ft => ft.key === selectedCategory)?.label || t.achCatAll}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card — fixed */}
      <View
        className="mx-5 mt-2 mb-2 p-5 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark"
      >
        <View className="flex-row items-center">
          {/* Trophy circle */}
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: '#F59E0B22' }}
          >
            <Text style={{ fontSize: 28 }}>🏆</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
              {unlockedCount} {t.achievementsOf} {totalCount}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
              {t.achievementsUnlocked}
            </Text>
          </View>
        </View>
        {/* Overall progress bar */}
        <View className="mt-4 h-2.5 bg-secondary dark:bg-secondary-dark rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.round((unlockedCount / totalCount) * 100)}%`,
              backgroundColor: '#F59E0B',
            }}
          />
        </View>
      </View>

      {/* Filter Dropdown Modal */}
      <Modal visible={filterVisible} transparent animationType="fade">
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setFilterVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 100, paddingRight: 20 }}>
            <View
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                minWidth: 160,
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            >
              {filterTabs.map((tab, idx) => {
                const isActive = selectedCategory === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.6}
                    onPress={() => {
                      setSelectedCategory(tab.key);
                      setFilterVisible(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: idx < filterTabs.length - 1 ? 0.5 : 0,
                      borderBottomColor: isDark ? '#333' : '#E8E8E8',
                      backgroundColor: isActive ? (tab.color + '12') : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: tab.color,
                        marginRight: 10,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? tab.color : (isDark ? '#CCC' : '#333'),
                      }}
                    >
                      {tab.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={18} color={tab.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Scrollable achievement list */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {visibleCategories.map((cat) => {
          const achievements = groupedAchievements.get(cat) || [];
          const catColor = CATEGORY_COLORS[cat];
          const sectionDelay = animDelay;
          animDelay += 60;

          return (
            <Animated.View
              key={`${cat}-${animKey}`}
              entering={FadeInDown.delay(sectionDelay + 100).duration(400)}
              className="mt-6"
            >
              {/* Section header */}
              <View className="flex-row items-center px-5 mb-3">
                <View
                  className="w-2 h-5 rounded-full mr-2"
                  style={{ backgroundColor: catColor }}
                />
                <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
                  {categoryNames[cat]}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark ml-2">
                  {achievements.filter((a) => a.unlocked).length}/{achievements.length}
                </Text>
              </View>

              {/* Achievement cards */}
              {achievements.map((ach, idx) => {
                const cardDelay = sectionDelay + 160 + idx * 60;
                return (
                  <AchievementCard
                    key={`${ach.def.id}-${animKey}`}
                    achievement={ach}
                    catColor={catColor}
                    delay={cardDelay}
                    isDark={isDark}
                    t={t}
                  />
                );
              })}
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Achievement Card Component ────────────────────────

function AchievementCard({
  achievement,
  catColor,
  delay,
  isDark,
  t,
}: {
  achievement: ComputedAchievement;
  catColor: string;
  delay: number;
  isDark: boolean;
  t: any;
}) {
  const { def, current, unlocked, progress } = achievement;
  const name = (t as any)[def.nameKey] || def.nameKey;
  const desc = (t as any)[def.descKey] || def.descKey;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      className="mx-5 mb-2.5"
    >
      <View
        className={`flex-row items-center p-4 rounded-2xl border ${
          unlocked
            ? 'border-border dark:border-border-dark bg-card dark:bg-card-dark'
            : 'border-border dark:border-border-dark bg-card dark:bg-card-dark'
        }`}
        style={unlocked ? { borderLeftWidth: 3, borderLeftColor: catColor } : undefined}
      >
        {/* Emoji */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: unlocked ? catColor + '22' : isDark ? '#262626' : '#F0F0F0',
          }}
        >
          <Text style={{ fontSize: 22, opacity: unlocked ? 1 : 0.4 }}>
            {def.emoji}
          </Text>
        </View>

        {/* Text & progress */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text
              className={`text-base font-semibold ${
                unlocked
                  ? 'text-foreground dark:text-foreground-dark'
                  : 'text-muted-foreground dark:text-muted-foreground-dark'
              }`}
            >
              {name}
            </Text>
            {unlocked && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={catColor}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
            {desc}
          </Text>

          {/* Progress bar (only for locked) */}
          {!unlocked && (
            <View className="mt-2">
              <View className="h-1.5 bg-secondary dark:bg-secondary-dark rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: catColor + '88',
                  }}
                />
              </View>
              <Text className="text-[10px] text-muted-foreground dark:text-muted-foreground-dark mt-1">
                {current} / {def.threshold}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
