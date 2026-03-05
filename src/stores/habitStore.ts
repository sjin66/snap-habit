import { create } from 'zustand';
import type { Habit, HabitEntry, TodayHabitItem } from '@types/habit';
import {
  initDatabase,
  getAllHabits,
  insertHabit,
  updateHabitInDB,
  deleteHabitFromDB,
  insertEntry,
  getEntriesByDate,
  deleteEntryByHabitAndDate,
  getEntriesByHabitAndRange,
} from '../services/database';

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
  getTodayItems: () => TodayHabitItem[];
}

const getToday = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayEntries: [],
  isLoading: true,

  initialize: () => {
    initDatabase();
    const habits = getAllHabits();
    const todayEntries = getEntriesByDate(getToday());
    set({ habits, todayEntries, isLoading: false });
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
  },

  checkIn: (habitId) => {
    const today = getToday();
    const already = get().todayEntries.find(
      (e) => e.habitId === habitId && e.date === today
    );
    if (already) return;

    const entry: HabitEntry = {
      id: `${habitId}_${Date.now()}`,
      habitId,
      date: today,
      completedAt: new Date().toISOString(),
    };
    insertEntry(entry);
    set((state) => ({ todayEntries: [...state.todayEntries, entry] }));
  },

  uncheckIn: (habitId) => {
    const today = getToday();
    deleteEntryByHabitAndDate(habitId, today);
    set((state) => ({
      todayEntries: state.todayEntries.filter(
        (e) => !(e.habitId === habitId && e.date === today)
      ),
    }));
  },

  getTodayItems: (): TodayHabitItem[] => {
    const { habits, todayEntries } = get();
    const today = getToday();
    return habits.map((habit) => {
      const entry = todayEntries.find(
        (e) => e.habitId === habit.id && e.date === today
      );

      // Calculate current streak (consecutive days including today)
      let streak = 0;
      const d = new Date();
      for (let i = 0; i < 365; i++) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        const dayEntries = getEntriesByHabitAndRange(habit.id, dateStr, dateStr);
        if (dayEntries.length > 0) {
          streak++;
        } else if (i === 0) {
          // Today not done yet — check from yesterday
          d.setDate(d.getDate() - 1);
          continue;
        } else {
          break;
        }
        d.setDate(d.getDate() - 1);
      }

      return {
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        dailyTarget: habit.dailyTarget,
        unit: habit.unit,
        isCompleted: !!entry,
        completedAt: entry?.completedAt,
        streak,
      };
    });
  },
}));
