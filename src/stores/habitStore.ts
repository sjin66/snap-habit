import { create } from 'zustand';
import type { Habit, HabitEntry, TodayHabitItem } from '@types/habit';

interface HabitState {
  habits: Habit[];
  todayEntries: HabitEntry[];
  isLoading: boolean;

  // Actions
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  checkIn: (habitId: string) => void;
  getTodayItems: () => TodayHabitItem[];
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayEntries: [],
  isLoading: false,

  setHabits: (habits) => set({ habits }),

  addHabit: (habit) =>
    set((state) => ({ habits: [...state.habits, habit] })),

  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

  deleteHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),

  checkIn: (habitId) => {
    const entry: HabitEntry = {
      id: `${habitId}_${Date.now()}`,
      habitId,
      date: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
    };
    set((state) => ({ todayEntries: [...state.todayEntries, entry] }));
  },

  getTodayItems: (): TodayHabitItem[] => {
    const { habits, todayEntries } = get();
    const today = new Date().toISOString().split('T')[0];
    return habits.map((habit) => {
      const entry = todayEntries.find(
        (e) => e.habitId === habit.id && e.date === today
      );
      return {
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        isCompleted: !!entry,
        completedAt: entry?.completedAt,
      };
    });
  },
}));
