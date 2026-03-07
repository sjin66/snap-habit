import * as SQLite from 'expo-sqlite';
import type { Habit, HabitEntry, FrequencyConfig } from '@types/habit';

let db: SQLite.SQLiteDatabase | null = null;

/** 获取数据库实例（单例） */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('snaphabit.db');
  }
  return db;
}

/** 初始化表结构 */
export function initDatabase(): void {
  const database = getDatabase();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      note TEXT,
      frequency_type TEXT NOT NULL DEFAULT 'daily',
      frequency_days_of_week TEXT,
      frequency_times_per_week INTEGER,
      daily_target INTEGER NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'times',
      reminder_time TEXT,
      created_at TEXT NOT NULL,
      archived_at TEXT
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE INDEX IF NOT EXISTS idx_entries_habit_date ON entries(habit_id, date);
  `);

  database.execSync(`
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
  `);

  // ─── Migrations: add columns that may be missing from older schemas ───
  const columns = database.getAllSync<{ name: string }>(
    `PRAGMA table_info(habits)`
  );
  const colNames = columns.map((c) => c.name);

  if (!colNames.includes('note')) {
    database.execSync(`ALTER TABLE habits ADD COLUMN note TEXT`);
  }
  if (!colNames.includes('daily_target')) {
    database.execSync(`ALTER TABLE habits ADD COLUMN daily_target INTEGER NOT NULL DEFAULT 1`);
  }
  if (!colNames.includes('reminder_time')) {
    database.execSync(`ALTER TABLE habits ADD COLUMN reminder_time TEXT`);
  }
  if (!colNames.includes('unit')) {
    database.execSync(`ALTER TABLE habits ADD COLUMN unit TEXT NOT NULL DEFAULT 'times'`);
  }
  if (!colNames.includes('sort_order')) {
    database.execSync(`ALTER TABLE habits ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`);
    // Backfill: assign sort_order based on current created_at order
    database.execSync(`
      UPDATE habits SET sort_order = (
        SELECT COUNT(*) FROM habits AS h2 WHERE h2.created_at < habits.created_at
      )
    `);
  }
}

// ─── Habits CRUD ────────────────────────────────────────

/** 读取所有未归档习惯 */
export function getAllHabits(): Habit[] {
  const database = getDatabase();
  const rows = database.getAllSync<any>(
    'SELECT * FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC, created_at ASC'
  );
  return rows.map(rowToHabit);
}

/** 插入一个习惯 */
export function insertHabit(habit: Habit): void {
  const database = getDatabase();
  // New habits get sort_order = max + 1 so they appear at the end
  const maxRow = database.getFirstSync<{ m: number | null }>('SELECT MAX(sort_order) AS m FROM habits');
  const nextOrder = (maxRow?.m ?? -1) + 1;
  database.runSync(
    `INSERT INTO habits (id, name, icon, color, note, frequency_type, frequency_days_of_week, frequency_times_per_week, daily_target, unit, reminder_time, created_at, archived_at, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    habit.id,
    habit.name,
    habit.icon,
    habit.color,
    habit.note ?? null,
    habit.frequency.type,
    habit.frequency.daysOfWeek ? JSON.stringify(habit.frequency.daysOfWeek) : null,
    habit.frequency.timesPerWeek ?? null,
    habit.dailyTarget ?? 1,
    habit.unit ?? 'times',
    habit.reminders && habit.reminders.length > 0 ? JSON.stringify(habit.reminders) : null,
    habit.createdAt,
    habit.archivedAt ?? null,
    nextOrder,
  );
}

/** 更新习惯 */
export function updateHabitInDB(id: string, updates: Partial<Habit>): void {
  const database = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.note !== undefined) { fields.push('note = ?'); values.push(updates.note); }
  if (updates.dailyTarget !== undefined) { fields.push('daily_target = ?'); values.push(updates.dailyTarget); }
  if (updates.unit !== undefined) { fields.push('unit = ?'); values.push(updates.unit); }
  if (updates.reminders !== undefined) { fields.push('reminder_time = ?'); values.push(updates.reminders && updates.reminders.length > 0 ? JSON.stringify(updates.reminders) : null); }
  if (updates.archivedAt !== undefined) { fields.push('archived_at = ?'); values.push(updates.archivedAt); }
  if (updates.frequency) {
    fields.push('frequency_type = ?'); values.push(updates.frequency.type);
    fields.push('frequency_days_of_week = ?'); values.push(updates.frequency.daysOfWeek ? JSON.stringify(updates.frequency.daysOfWeek) : null);
    fields.push('frequency_times_per_week = ?'); values.push(updates.frequency.timesPerWeek ?? null);
  }

  if (fields.length === 0) return;
  values.push(id);
  database.runSync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

/** 删除习惯（同时删除打卡记录） */
export function deleteHabitFromDB(id: string): void {
  const database = getDatabase();
  database.runSync('DELETE FROM entries WHERE habit_id = ?', id);
  database.runSync('DELETE FROM habits WHERE id = ?', id);
}

/** 批量更新排序 */
export function updateHabitSortOrders(orderedIds: string[]): void {
  const database = getDatabase();
  for (let i = 0; i < orderedIds.length; i++) {
    database.runSync('UPDATE habits SET sort_order = ? WHERE id = ?', i, orderedIds[i]);
  }
}

// ─── Entries CRUD ───────────────────────────────────────

/** 插入打卡记录 */
export function insertEntry(entry: HabitEntry): void {
  const database = getDatabase();
  database.runSync(
    'INSERT INTO entries (id, habit_id, date, completed_at, note) VALUES (?, ?, ?, ?, ?)',
    entry.id,
    entry.habitId,
    entry.date,
    entry.completedAt,
    entry.note ?? null,
  );
}

/** 获取某天所有打卡记录 */
export function getEntriesByDate(date: string): HabitEntry[] {
  const database = getDatabase();
  const rows = database.getAllSync<any>(
    'SELECT * FROM entries WHERE date = ?',
    date,
  );
  return rows.map(rowToEntry);
}

/** 获取某个习惯在某个日期范围内的打卡记录 */
export function getEntriesByHabitAndRange(
  habitId: string,
  startDate: string,
  endDate: string,
): HabitEntry[] {
  const database = getDatabase();
  const rows = database.getAllSync<any>(
    'SELECT * FROM entries WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
    habitId,
    startDate,
    endDate,
  );
  return rows.map(rowToEntry);
}

/** 获取日期范围内所有打卡记录 */
export function getEntriesInRange(startDate: string, endDate: string): HabitEntry[] {
  const database = getDatabase();
  const rows = database.getAllSync<any>(
    'SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
    startDate,
    endDate,
  );
  return rows.map(rowToEntry);
}

/** 删除打卡记录（撤销） */
export function deleteEntry(id: string): void {
  const database = getDatabase();
  database.runSync('DELETE FROM entries WHERE id = ?', id);
}

/** 删除某个习惯某天的打卡记录（撤销当天打卡） */
export function deleteEntryByHabitAndDate(habitId: string, date: string): void {
  const database = getDatabase();
  database.runSync(
    'DELETE FROM entries WHERE habit_id = ? AND date = ?',
    habitId,
    date,
  );
}

// ─── Row → Model 转换 ──────────────────────────────────

/** Parse reminder_time column: supports JSON array or legacy single "HH:mm" */
function parseReminders(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return undefined;
  } catch {
    // Legacy single "HH:mm" format
    if (/^\d{2}:\d{2}$/.test(raw)) return [raw];
    return undefined;
  }
}

function rowToHabit(row: any): Habit {
  const frequency: FrequencyConfig = {
    type: row.frequency_type,
    daysOfWeek: row.frequency_days_of_week
      ? JSON.parse(row.frequency_days_of_week)
      : undefined,
    timesPerWeek: row.frequency_times_per_week ?? undefined,
  };

  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    note: row.note ?? undefined,
    frequency,
    dailyTarget: row.daily_target ?? 1,
    unit: row.unit ?? 'times',
    reminders: parseReminders(row.reminder_time),
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
  };
}

function rowToEntry(row: any): HabitEntry {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
    note: row.note ?? undefined,
  };
}
