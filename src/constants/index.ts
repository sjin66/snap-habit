// App Group 共享存储 Key 常量
export const APP_GROUP_ID = 'group.com.snaphabit.app';

export const STORAGE_KEYS = {
  TODAY_SNAPSHOT: 'today_snapshot',   // Widget / Watch 读取
  HABITS: 'habits',
  SETTINGS: 'settings',
} as const;

export const COLORS = {
  primary: '#6C63FF',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  border: '#E9ECEF',
} as const;

export const HABIT_ICONS = [
  '💧', '🏃', '📚', '🧘', '💊', '🍎',
  '😴', '🎯', '💪', '✍️', '🎵', '🌿',
] as const;
