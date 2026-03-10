// Habit 数据模型
export const HABIT_CATEGORIES = [
  { name: 'Health',       color: '#22C55E' },
  { name: 'Mind',         color: '#8B5CF6' },
  { name: 'Productivity', color: '#F59E0B' },
  { name: 'Learning',     color: '#3B82F6' },
  { name: 'Social',       color: '#EC4899' },
  { name: 'Finance',      color: '#14B8A6' },
  { name: 'Creative',     color: '#F97316' },
  { name: 'Lifestyle',    color: '#84CC16' },
  { name: 'Other',        color: '#6B7280' },
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number]['name'];

type LegacyHabitCategory = 'Fitness' | 'Mindfulness';

const LEGACY_CATEGORY_MAP: Record<LegacyHabitCategory, HabitCategory> = {
  Fitness: 'Health',
  Mindfulness: 'Mind',
};

export function normalizeHabitCategory(category?: string): HabitCategory | undefined {
  if (!category) return undefined;

  const directMatch = HABIT_CATEGORIES.find((c) => c.name === category);
  if (directMatch) return directMatch.name;

  return LEGACY_CATEGORY_MAP[category as LegacyHabitCategory];
}

/** Darken a hex color by a factor (0–1, e.g. 0.25 = 25% darker) */
function darken(hex: string, amount: number): string {
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Returns the category color — uses darker shade in light mode for better contrast */
export function getCategoryColor(category?: HabitCategory, isDark = false): string | undefined {
  const normalized = normalizeHabitCategory(category);
  if (!normalized) return undefined;
  const cat = HABIT_CATEGORIES.find((c) => c.name === normalized);
  if (!cat) return undefined;
  return isDark ? cat.color : darken(cat.color, 0.25);
}

export interface Habit {
  id: string;
  name: string;
  icon: string;           // Ionicons name
  color: string;          // hex color
  category?: HabitCategory; // 分类
  note?: string;          // 备注
  frequency: FrequencyConfig;
  dailyTarget: number;    // 每日目标次数
  unit: string;           // 单位 (times, min, hours, pages, etc.)
  reminders?: string[];   // ["HH:mm", ...] multiple reminder times
  createdAt: string;      // ISO date
  archivedAt?: string;
  deletedAt?: string;      // 软删除时间
}

export interface FrequencyConfig {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[];  // ISO: 1=Mon, 2=Tue, ... 7=Sun
  timesPerWeek?: number;
}

// 打卡记录
export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;           // "YYYY-MM-DD"
  completedAt: string;    // ISO datetime
  note?: string;
  status?: 'completed' | 'skipped';  // default: 'completed'
}

// 今日快照（供 Widget / Watch 读取）
export interface TodaySnapshot {
  date: string;
  habits: TodayHabitItem[];
  updatedAt: string;
}

export type HabitDayStatus = 'active' | 'completed' | 'skipped' | 'rest';

export interface TodayHabitItem {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  category?: HabitCategory;
  dailyTarget: number;
  unit: string;
  isCompleted: boolean;
  isSkipped: boolean;
  completedAt?: string;
  streak: number;
  status: HabitDayStatus;
}
