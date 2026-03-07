// Habit 数据模型
export interface Habit {
  id: string;
  name: string;
  icon: string;           // Ionicons name
  color: string;          // hex color
  note?: string;          // 备注
  frequency: FrequencyConfig;
  dailyTarget: number;    // 每日目标次数
  unit: string;           // 单位 (times, min, hours, pages, etc.)
  reminders?: string[];   // ["HH:mm", ...] multiple reminder times
  createdAt: string;      // ISO date
  archivedAt?: string;
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
}

// 今日快照（供 Widget / Watch 读取）
export interface TodaySnapshot {
  date: string;
  habits: TodayHabitItem[];
  updatedAt: string;
}

export type HabitDayStatus = 'active' | 'completed' | 'rest';

export interface TodayHabitItem {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  dailyTarget: number;
  unit: string;
  isCompleted: boolean;
  completedAt?: string;
  streak: number;
  status: HabitDayStatus;
}
