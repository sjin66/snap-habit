// Habit 数据模型
export interface Habit {
  id: string;
  name: string;
  icon: string;           // emoji 或 SF Symbol 名称
  color: string;          // hex color
  frequency: FrequencyConfig;
  reminderTime?: string;  // "HH:mm"
  createdAt: string;      // ISO date
  archivedAt?: string;
}

export interface FrequencyConfig {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[];  // 0=Sun, 1=Mon, ... 6=Sat
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

export interface TodayHabitItem {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  isCompleted: boolean;
  completedAt?: string;
}
