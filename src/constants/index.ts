// App Group 共享存储 Key 常量
export const APP_GROUP_ID = 'group.com.snaphabit.app';

export const STORAGE_KEYS = {
  TODAY_SNAPSHOT: 'today_snapshot',   // Widget / Watch 读取
  HABITS: 'habits',
  SETTINGS: 'settings',
} as const;

export const COLORS = {
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  card: '#FFFFFF',
  primary: '#171717',
  primaryForeground: '#FAFAFA',
  secondary: '#F5F5F5',
  muted: '#F5F5F5',
  mutedForeground: '#737373',
  destructive: '#EF4444',
  border: '#E5E5E5',
  // Dark
  darkBackground: '#0A0A0A',
  darkForeground: '#FAFAFA',
  darkCard: '#0A0A0A',
  darkPrimary: '#FAFAFA',
  darkSecondary: '#262626',
  darkMuted: '#262626',
  darkMutedForeground: '#A3A3A3',
  darkBorder: '#262626',
} as const;

export const HABIT_ICONS = [
  'water', 'walk', 'book', 'leaf', 'medkit', 'nutrition',
  'moon', 'flag', 'fitness', 'pencil', 'musical-notes', 'flower',
] as const;
