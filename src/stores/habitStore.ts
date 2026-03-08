import { create } from 'zustand';
import type { Habit, HabitEntry, TodayHabitItem } from '@types/habit';
import {
  initDatabase,
  getAllHabits,
  insertHabit,
  updateHabitInDB,
  deleteHabitFromDB,
  updateHabitSortOrders,
  insertEntry,
  getEntriesByDate,
  deleteEntryByHabitAndDate,
  getEntriesByHabitAndRange,
  generateId,
} from '../services/database';
import {
  cancelHabitReminders,
  scheduleHabitReminders,
  refreshAllReminders,
} from '../services/notifications';

interface HabitState {
  habits: Habit[];
  todayEntries: HabitEntry[];
  isLoading: boolean;

  // Actions
  initialize: () => void;
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (orderedIds: string[]) => void;
  checkIn: (habitId: string) => void;
  uncheckIn: (habitId: string) => void;
  skipHabit: (habitId: string) => void;
  unskipHabit: (habitId: string) => void;
  getTodayItems: () => TodayHabitItem[];
}

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Check if a given date is a rest day for a habit's frequency config */
export function isRestDay(frequency: { type: string; daysOfWeek?: number[] }, date: Date): boolean {
  if (frequency.type === 'daily') return false;
  if (frequency.type === 'weekly' || frequency.type === 'custom') {
    const dow = date.getDay() || 7; // Convert JS 0=Sun to ISO 7=Sun (Mon=1..Sun=7)
    if (frequency.daysOfWeek && frequency.daysOfWeek.length > 0) {
      return !frequency.daysOfWeek.includes(dow);
    }
  }
  return false;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayEntries: [],
  isLoading: true,

  initialize: () => {
    initDatabase();
    const habits = getAllHabits();
    const todayEntries = getEntriesByDate(getToday());
    set({ habits, todayEntries, isLoading: false });

    // Refresh notifications: cancel reminders for already-completed habits,
    // reschedule for uncompleted ones
    const completedIds = new Set(todayEntries.map((e) => e.habitId));
    refreshAllReminders(habits, completedIds).catch(() => {});
  },

  setHabits: (habits) => set({ habits }),

  addHabit: (habit) => {
    insertHabit(habit);
    set((state) => ({ habits: [...state.habits, habit] }));
  },

  updateHabit: (id, updates) => {
    updateHabitInDB(id, updates);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  },

  deleteHabit: (id) => {
    deleteHabitFromDB(id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));
  },

  reorderHabits: (orderedIds) => {
    set((state) => {
      const habitMap = new Map(state.habits.map((h) => [h.id, h]));
      const reordered = orderedIds
        .map((id) => habitMap.get(id))
        .filter(Boolean) as Habit[];
      return { habits: reordered };
    });
    // Persist sort order to database
    updateHabitSortOrders(orderedIds);
  },

  checkIn: (habitId) => {
    const today = getToday();
    const already = get().todayEntries.find(
      (e) => e.habitId === habitId && e.date === today
    );
    if (already) return;

    const entry: HabitEntry = {
      id: generateId(),
      habitId,
      date: today,
      completedAt: new Date().toISOString(),
    };
    insertEntry(entry);
    set((state) => ({ todayEntries: [...state.todayEntries, entry] }));

    // Cancel today's remaining reminders for this habit
    cancelHabitReminders(habitId).catch(() => {});
  },

  uncheckIn: (habitId) => {
    const today = getToday();
    deleteEntryByHabitAndDate(habitId, today);
    set((state) => ({
      todayEntries: state.todayEntries.filter(
        (e) => !(e.habitId === habitId && e.date === today)
      ),
    }));

    // Reschedule reminders since the habit is now uncompleted
    const habit = get().habits.find((h) => h.id === habitId);
    if (habit?.reminders && habit.reminders.length > 0) {
      scheduleHabitReminders(habitId, habit.name, habit.reminders, habit.frequency).catch(() => {});
    }
  },

  skipHabit: (habitId) => {
    const today = getToday();
    // Remove any existing entry for today first
    deleteEntryByHabitAndDate(habitId, today);
    const filteredEntries = get().todayEntries.filter(
      (e) => !(e.habitId === habitId && e.date === today)
    );

    const entry: HabitEntry = {
      id: generateId(),
      habitId,
      date: today,
      completedAt: new Date().toISOString(),
      status: 'skipped',
    };
    insertEntry(entry);
    set({ todayEntries: [...filteredEntries, entry] });

    // Cancel today's reminders for this habit
    cancelHabitReminders(habitId).catch(() => {});
  },

  unskipHabit: (habitId) => {
    const today = getToday();
    deleteEntryByHabitAndDate(habitId, today);
    set((state) => ({
      todayEntries: state.todayEntries.filter(
        (e) => !(e.habitId === habitId && e.date === today)
      ),
    }));

    // Reschedule reminders
    const habit = get().habits.find((h) => h.id === habitId);
    if (habit?.reminders && habit.reminders.length > 0) {
      scheduleHabitReminders(habitId, habit.name, habit.reminders, habit.frequency).catch(() => {});
    }
  },

  getTodayItems: (): TodayHabitItem[] => {
    const { habits, todayEntries } = get();
    const today = getToday();
    const todayDate = new Date();
    return habits.map((habit) => {
      const entry = todayEntries.find(
        (e) => e.habitId === habit.id && e.date === today
      );

      const rest = isRestDay(habit.frequency, todayDate);
      const completed = !!entry && entry.status !== 'skipped';
      const skipped = !!entry && entry.status === 'skipped';

      // Calculate current streak using batch query (one query per habit)
      const streakStartDate = new Date();
      streakStartDate.setDate(streakStartDate.getDate() - 365);
      const streakStartStr = `${streakStartDate.getFullYear()}-${String(streakStartDate.getMonth() + 1).padStart(2, '0')}-${String(streakStartDate.getDate()).padStart(2, '0')}`;
      const todayStr = getToday();
      const allEntries = getEntriesByHabitAndRange(habit.id, streakStartStr, todayStr);
      const entryByDate = new Map<string, HabitEntry[]>();
      for (const e of allEntries) {
        const list = entryByDate.get(e.date) || [];
        list.push(e);
        entryByDate.set(e.date, list);
      }

      let streak = 0;
      const d = new Date();
      for (let i = 0; i < 365; i++) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;

        // Skip rest days — they don't break or count toward streak
        if (isRestDay(habit.frequency, new Date(d))) {
          d.setDate(d.getDate() - 1);
          continue;
        }

        const dayEntries = entryByDate.get(dateStr) || [];
        const hasSkip = dayEntries.some((e) => e.status === 'skipped');
        const hasCompleted = dayEntries.some((e) => e.status !== 'skipped');
        if (hasCompleted) {
          streak++;
        } else if (hasSkip) {
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

      // Determine status
      let status: 'active' | 'completed' | 'skipped' | 'rest';
      if (completed) {
        status = 'completed';
      } else if (skipped) {
        status = 'skipped';
      } else if (rest) {
        status = 'rest';
      } else {
        status = 'active';
      }

      return {
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        category: habit.category,
        dailyTarget: habit.dailyTarget,
        unit: habit.unit,
        isCompleted: completed,
        isSkipped: skipped,
        completedAt: entry?.completedAt,
        streak,
        status,
      };
    });
  },
}));
