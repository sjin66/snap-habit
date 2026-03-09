// App Group 共享存储 Key 常量
export const APP_GROUP_ID = 'group.com.snaphabit.app';

export const STORAGE_KEYS = {
  TODAY_SNAPSHOT: 'today_snapshot',   // Widget / Watch 读取
  HABITS: 'habits',
  SETTINGS: 'settings',
} as const;

export const HABIT_ICONS = [
  'water', 'walk', 'book', 'leaf', 'medkit', 'nutrition',
  'moon', 'flag', 'fitness', 'pencil', 'musical-notes', 'flower',
] as const;
