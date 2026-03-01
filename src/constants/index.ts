// App Group 共享存储 Key 常量
export const APP_GROUP_ID = 'group.com.snaphabit.app';

export const STORAGE_KEYS = {
  TODAY_SNAPSHOT: 'today_snapshot',   // Widget / Watch 读取
  HABITS: 'habits',
  SETTINGS: 'settings',
} as const;

export const COLORS = {
  primary: '#171717',
  primaryForeground: '#FAFAFA',
  secondary: '#F5F5F5',
  muted: '#F5F5F5',
  mutedForeground: '#737373',
  destructive: '#EF4444',
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  surface: '#FFFFFF',
  text: '#0A0A0A',
  textSecondary: '#737373',
  border: '#E5E5E5',
} as const;

export const HABIT_ICONS = [
  '💧', '🏃', '📚', '🧘', '💊', '🍎',
  '😴', '🎯', '💪', '✍️', '🎵', '🌿',
] as const;
