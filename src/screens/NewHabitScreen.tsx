import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useHabitStore } from '../stores/habitStore';
import {
  requestPermissions,
  scheduleHabitReminders,
  cancelHabitReminders,
} from '../services/notifications';
import type { FrequencyConfig, HabitCategory } from '@types/habit';
import { HABIT_CATEGORIES, getCategoryColor } from '../types/habit';
import type { RootStackParamList } from '../navigation/RootNavigator';
import WheelPicker from '../components/WheelPicker';

// ─── 可选图标列表 ──────────────────────────────────────
const ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'water', 'fitness', 'bar-chart', 'construct', 'moon', 'sunny',
  'book', 'leaf', 'pencil', 'flash', 'nutrition', 'musical-notes',
  'bicycle', 'walk', 'heart', 'medkit', 'globe', 'rocket',
  'timer', 'bulb', 'cafe', 'bed', 'flower', 'flag',
];

// ─── 可选颜色列表 ──────────────────────────────────────
const HABIT_COLORS = [
  '#3B82F6', '#EF4444', '#F59E0B', '#22C55E',
  '#8B5CF6', '#06B6D4', '#F97316', '#EC4899',
  '#14B8A6', '#6366F1', '#84CC16', '#F43F5E',
  '#0EA5E9', '#A855F7', '#D946EF', '#10B981',
];

// ─── 单位列表 ──────────────────────────────────────────
const UNITS = [
  { key: 'times', label: 'times', singular: 'time' },
  { key: 'min', label: 'min', singular: 'min' },
  { key: 'hours', label: 'hours', singular: 'hour' },
  { key: 'pages', label: 'pages', singular: 'page' },
  { key: 'glasses', label: 'glasses', singular: 'glass' },
  { key: 'steps', label: 'steps', singular: 'step' },
  { key: 'km', label: 'km', singular: 'km' },
  { key: 'ml', label: 'ml', singular: 'ml' },
  { key: 'cal', label: 'cal', singular: 'cal' },
];

// ─── 时间选择数据 ──────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// ─── 星期几常量 ─────────────────────────────────────────
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7];

type NewHabitRouteParams = {
  NewHabit: {
    editHabitId?: string;
    presetName?: string;
    presetIcon?: string;
    presetColor?: string;
    presetGoal?: number;
    presetUnit?: string;
    presetCategory?: string;
  };
};

export function NewHabitScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<NewHabitRouteParams, 'NewHabit'>>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addHabit, updateHabit, habits } = useHabitStore();

  const preset = route.params ?? {};
  const isEditing = !!preset.editHabitId;
  const editHabit = isEditing ? habits.find((h) => h.id === preset.editHabitId) : undefined;

  const [name, setName] = useState(editHabit?.name ?? preset.presetName ?? '');
  const [note, setNote] = useState(editHabit?.note ?? '');
  const [selectedIcon, setSelectedIcon] = useState<string>(editHabit?.icon ?? preset.presetIcon ?? ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(editHabit?.color ?? preset.presetColor ?? HABIT_COLORS[0]);
  const [dailyTarget, setDailyTarget] = useState(editHabit?.dailyTarget ?? preset.presetGoal ?? 1);
  const [targetText, setTargetText] = useState(String(editHabit?.dailyTarget ?? preset.presetGoal ?? 1));
  const [unit, setUnit] = useState(editHabit?.unit ?? preset.presetUnit ?? 'times');
  const [category, setCategory] = useState<HabitCategory | undefined>(
    editHabit?.category ?? (preset.presetCategory as HabitCategory | undefined) ?? undefined,
  );
  const [freqType, setFreqType] = useState<'daily' | 'weekly'>(
    (editHabit?.frequency?.type === 'weekly' ? 'weekly' : 'daily') as 'daily' | 'weekly',
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    editHabit?.frequency?.type === 'weekly' && editHabit.frequency.daysOfWeek
      ? editHabit.frequency.daysOfWeek
      : [1, 2, 3, 4, 5],
  );
  const [reminders, setReminders] = useState<string[]>(
    editHabit?.reminders ?? [],
  );
  const [editingReminderIndex, setEditingReminderIndex] = useState<number | null>(null);
  const [pickerHour, setPickerHour] = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);

  const iconScrollRef = useRef<ScrollView>(null);
  const colorScrollRef = useRef<ScrollView>(null);
  const unitScrollRef = useRef<ScrollView>(null);
  const iconScrollWidth = useRef(0);
  const colorScrollWidth = useRef(0);
  const unitScrollWidth = useRef(0);

  // 自动滚动到预设图标/颜色位置（居中显示）
  useEffect(() => {
    const ICON_ITEM_WIDTH = 44 + 12; // w-11 (44) + mr-3 (12)
    const iconIndex = ICONS.indexOf(selectedIcon as any);
    if (iconIndex > 0) {
      setTimeout(() => {
        const offset = Math.max(0, iconIndex * ICON_ITEM_WIDTH - (iconScrollWidth.current - ICON_ITEM_WIDTH) / 2);
        iconScrollRef.current?.scrollTo({ x: offset, animated: false });
      }, 100);
    }

    const COLOR_ITEM_WIDTH = 36 + 12; // w-9 (36) + mr-3 (12)
    const colorIndex = HABIT_COLORS.indexOf(selectedColor);
    if (colorIndex > 0) {
      setTimeout(() => {
        const offset = Math.max(0, colorIndex * COLOR_ITEM_WIDTH - (colorScrollWidth.current - COLOR_ITEM_WIDTH) / 2);
        colorScrollRef.current?.scrollTo({ x: offset, animated: false });
      }, 100);
    }

    const UNIT_ITEM_WIDTH = 60 + 8; // ~px-3.5 (avg ~60) + gap-2 (8)
    const unitIndex = UNITS.findIndex((u) => u.key === unit);
    if (unitIndex > 0) {
      setTimeout(() => {
        const offset = Math.max(0, unitIndex * UNIT_ITEM_WIDTH - (unitScrollWidth.current - UNIT_ITEM_WIDTH) / 2);
        unitScrollRef.current?.scrollTo({ x: offset, animated: false });
      }, 100);
    }
  }, []);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddReminder = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in Settings to use reminders.',
      );
      return;
    }
    // Default new reminder to 09:00
    const newTime = '09:00';
    const newIndex = reminders.length;
    setReminders((prev) => [...prev, newTime]);
    // Open picker for the new reminder
    setPickerHour(9);
    setPickerMinute(0);
    setEditingReminderIndex(newIndex);
  };

  const handleRemoveReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
    if (editingReminderIndex === index) {
      setEditingReminderIndex(null);
    } else if (editingReminderIndex !== null && editingReminderIndex > index) {
      setEditingReminderIndex(editingReminderIndex - 1);
    }
  };

  const handleTapReminder = (index: number) => {
    if (editingReminderIndex === index) {
      setEditingReminderIndex(null);
      return;
    }
    const [h, m] = reminders[index].split(':').map(Number);
    setPickerHour(h);
    setPickerMinute(m);
    setEditingReminderIndex(index);
  };

  // Sync picker changes back to reminders array
  useEffect(() => {
    if (editingReminderIndex === null) return;
    const timeStr = `${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`;
    setReminders((prev) => {
      if (editingReminderIndex >= prev.length) return prev;
      const next = [...prev];
      next[editingReminderIndex] = timeStr;
      return next;
    });
  }, [pickerHour, pickerMinute]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const frequency: FrequencyConfig =
      freqType === 'daily'
        ? { type: 'daily' }
        : { type: 'weekly', daysOfWeek: selectedDays };

    const habitReminders = reminders.length > 0 ? reminders : undefined;

    const habitId = isEditing && preset.editHabitId
      ? preset.editHabitId
      : Date.now().toString();

    if (isEditing && preset.editHabitId) {
      updateHabit(preset.editHabitId, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        category,
        note: note.trim() || undefined,
        frequency,
        dailyTarget,
        unit,
        reminders: habitReminders,
      });
    } else {
      addHabit({
        id: habitId,
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        category,
        note: note.trim() || undefined,
        frequency,
        dailyTarget,
        unit,
        reminders: habitReminders,
        createdAt: new Date().toISOString(),
      });
    }

    // Schedule or cancel notifications
    if (habitReminders && habitReminders.length > 0) {
      await scheduleHabitReminders(habitId, name.trim(), habitReminders, frequency);
    } else {
      await cancelHabitReminders(habitId);
    }

    navigation.popToTop();
  };

  return (
    <View className="flex-1 bg-page-bg dark:bg-page-bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={24} color={isDark ? '#FAFAFA' : '#0A0A0A'} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          {isEditing ? 'Edit Habit' : 'New Habit'}
        </Text>
        <TouchableOpacity onPress={handleCreate} hitSlop={12}>
          <Text className="text-base font-semibold text-accent dark:text-accent-dark">
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BASIC INFO ─────────────────────────────── */}
        <Text className="text-xs font-semibold tracking-wider px-5 pt-5 pb-2 text-muted-foreground dark:text-muted-foreground-dark">
          BASIC INFO
        </Text>
        <View className="mx-5 rounded-2xl overflow-hidden bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          <View className="flex-row items-center px-4 py-3.5 border-b border-border dark:border-border-dark">
            <Text className="text-base font-medium w-16 text-foreground dark:text-foreground-dark">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Morning Yoga"
              placeholderTextColor={isDark ? '#A3A3A3' : '#737373'}
              className="flex-1 text-base text-foreground dark:text-foreground-dark"
            />
          </View>
          <View className="flex-row items-center px-4 py-3.5">
            <Text className="text-base font-medium w-16 text-foreground dark:text-foreground-dark">Notes</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional"
              placeholderTextColor={isDark ? '#A3A3A3' : '#737373'}
              className="flex-1 text-base text-foreground dark:text-foreground-dark"
            />
          </View>
        </View>

        {/* ── APPEARANCE ─────────────────────────────── */}
        <Text className="text-xs font-semibold tracking-wider px-5 pt-6 pb-2 text-muted-foreground dark:text-muted-foreground-dark">
          APPEARANCE
        </Text>
        <View className="mx-5 rounded-2xl px-4 py-4 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          {/* Category */}
          <Text className="text-sm font-medium mb-3 text-foreground dark:text-foreground-dark">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {HABIT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.name;
                const chipColor = getCategoryColor(cat.name, isDark) ?? cat.color;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => setCategory(isSelected ? undefined : cat.name)}
                    className={`px-3.5 py-1.5 rounded-full ${
                      isSelected
                        ? ''
                        : 'border border-border dark:border-border-dark'
                    }`}
                    style={isSelected ? { backgroundColor: chipColor + '20', borderWidth: 1.5, borderColor: chipColor } : undefined}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected
                          ? ''
                          : 'text-foreground dark:text-foreground-dark'
                      }`}
                      style={isSelected ? { color: chipColor } : undefined}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Icon */}
          <Text className="text-sm font-medium mb-3 text-foreground dark:text-foreground-dark">Icon</Text>
          <ScrollView
            ref={iconScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            onLayout={(e) => { iconScrollWidth.current = e.nativeEvent.layout.width; }}
          >
            <View className="flex-row">
              {ICONS.map((icon) => {
                const isSelected = icon === selectedIcon;
                return (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    className={`items-center justify-center mr-3 mb-2 w-11 h-11 rounded-full ${
                      isSelected ? '' : 'bg-section-bg dark:bg-section-bg-dark'
                    }`}
                    style={isSelected ? {
                      backgroundColor: selectedColor + '20',
                      borderWidth: 2,
                      borderColor: selectedColor,
                    } : undefined}
                  >
                    <Ionicons
                      name={icon as any}
                      size={22}
                      color={isSelected ? selectedColor : (isDark ? '#A3A3A3' : '#737373')}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Color */}
          <Text className="text-sm font-medium mb-3 text-foreground dark:text-foreground-dark">Color</Text>
          <ScrollView
            ref={colorScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={(e) => { colorScrollWidth.current = e.nativeEvent.layout.width; }}
          >
            <View className="flex-row">
              {HABIT_COLORS.map((color) => {
                const isSelected = color === selectedColor;
                return (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className="mr-3 w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: isSelected ? (isDark ? '#FAFAFA' : '#0A0A0A') : 'transparent',
                    }}
                  >
                    {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

        </View>

        {/* ── GOAL & FREQUENCY ───────────────────────── */}
        <Text className="text-xs font-semibold tracking-wider px-5 pt-6 pb-2 text-muted-foreground dark:text-muted-foreground-dark">
          GOAL & FREQUENCY
        </Text>
        <View className="mx-5 rounded-2xl px-4 py-5 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          {/* Daily Target */}
          <Text className="text-base font-semibold text-center mb-3 text-foreground dark:text-foreground-dark">
            Daily Target
          </Text>
          <View className="flex-row items-center justify-center mb-5">
            <TouchableOpacity
              onPress={() => {
                const next = Math.max(1, dailyTarget - 1);
                setDailyTarget(next);
                setTargetText(String(next));
              }}
              className="w-11 h-11 rounded-full items-center justify-center bg-section-bg dark:bg-section-bg-dark"
            >
              <Ionicons name="remove" size={22} color={isDark ? '#A3A3A3' : '#737373'} />
            </TouchableOpacity>
            <View className="items-center mx-6">
              <TextInput
                value={targetText}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setTargetText(cleaned);
                  const num = parseInt(cleaned, 10);
                  if (!isNaN(num) && num > 0) setDailyTarget(num);
                }}
                onBlur={() => {
                  if (!targetText || parseInt(targetText, 10) <= 0) {
                    setDailyTarget(1);
                    setTargetText('1');
                  }
                }}
                keyboardType="number-pad"
                className="text-4xl font-bold text-foreground dark:text-foreground-dark text-center"
                style={{ minWidth: Math.max(48, targetText.length * 24) }}
                selectTextOnFocus
              />
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                {(() => {
                  const u = UNITS.find((u) => u.key === unit)!;
                  return dailyTarget === 1 ? u.singular : u.label;
                })()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const next = dailyTarget + 1;
                setDailyTarget(next);
                setTargetText(String(next));
              }}
              className="w-11 h-11 rounded-full items-center justify-center bg-section-bg dark:bg-section-bg-dark"
            >
              <Ionicons name="add" size={22} color={isDark ? '#A3A3A3' : '#737373'} />
            </TouchableOpacity>
          </View>

          {/* Unit selector */}
          <ScrollView
            ref={unitScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            onLayout={(e) => { unitScrollWidth.current = e.nativeEvent.layout.width; }}
          >
            <View className="flex-row gap-2">
              {UNITS.map((u) => {
                const isSelected = u.key === unit;
                return (
                  <TouchableOpacity
                    key={u.key}
                    onPress={() => setUnit(u.key)}
                    className={`px-3.5 py-1.5 rounded-full ${
                      isSelected
                        ? 'bg-primary dark:bg-primary-dark'
                        : 'border border-border dark:border-border-dark'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      isSelected
                        ? 'text-primary-foreground dark:text-primary-foreground-dark'
                        : 'text-foreground dark:text-foreground-dark'
                    }`}>
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Daily / Weekly toggle */}
          <View className="flex-row rounded-xl mb-4 gap-3">
            <TouchableOpacity
              onPress={() => setFreqType('daily')}
              className={`flex-1 py-2.5 items-center rounded-xl ${
                freqType === 'daily'
                  ? 'bg-primary dark:bg-primary-dark'
                  : 'border border-foreground dark:border-foreground-dark'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                freqType === 'daily'
                  ? 'text-primary-foreground dark:text-primary-foreground-dark'
                  : 'text-foreground dark:text-foreground-dark'
              }`}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFreqType('weekly')}
              className={`flex-1 py-2.5 items-center rounded-xl ${
                freqType === 'weekly'
                  ? 'bg-primary dark:bg-primary-dark'
                  : 'border border-foreground dark:border-foreground-dark'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                freqType === 'weekly'
                  ? 'text-primary-foreground dark:text-primary-foreground-dark'
                  : 'text-foreground dark:text-foreground-dark'
              }`}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Weekday selector */}
          {freqType === 'weekly' && (
            <View className="flex-row justify-between">
              {WEEKDAYS.map((label, idx) => {
                const dayVal = WEEKDAY_VALUES[idx];
                const isActive = selectedDays.includes(dayVal);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => toggleDay(dayVal)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isActive ? '' : 'bg-section-bg dark:bg-section-bg-dark'
                    }`}
                    style={isActive ? { backgroundColor: selectedColor } : undefined}
                  >
                    <Text className={`text-sm font-semibold ${
                      isActive ? 'text-white' : 'text-muted-foreground dark:text-muted-foreground-dark'
                    }`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── REMINDERS ──────────────────────────────── */}
        <View className="mx-5 mt-4 rounded-2xl px-4 py-4 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={22} color={isDark ? '#B4B4B4' : '#8E8E8E'} />
              <Text className="text-base font-medium ml-2 text-foreground dark:text-foreground-dark">
                Reminders
              </Text>
            </View>
            <TouchableOpacity onPress={handleAddReminder} hitSlop={12}>
              <Ionicons name="add-circle" size={26} color={isDark ? '#B4B4B4' : '#8E8E8E'} />
            </TouchableOpacity>
          </View>

          {/* Reminder list */}
          {reminders.length > 0 && (
            <View className="mt-3 pt-3 border-t border-border dark:border-border-dark">
              {reminders.map((time, index) => (
                <View key={index}>
                  <View className="flex-row items-center justify-between py-2.5">
                    <TouchableOpacity
                      onPress={() => handleTapReminder(index)}
                      className="flex-1 flex-row items-center"
                      hitSlop={8}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={editingReminderIndex === index ? selectedColor : (isDark ? '#B4B4B4' : '#8E8E8E')}
                      />
                      <Text
                        className="text-base ml-2"
                        style={{ color: editingReminderIndex === index ? selectedColor : (isDark ? '#FAFAFA' : '#0A0A0A') }}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveReminder(index)} hitSlop={12}>
                      <Ionicons name="remove-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Inline picker for the selected reminder */}
                  {editingReminderIndex === index && (
                    <View className="py-2">
                      <View className="flex-row items-center justify-center">
                        <WheelPicker
                          data={HOURS}
                          selectedIndex={pickerHour}
                          onChange={setPickerHour}
                          width={64}
                        />
                        <Text className="text-2xl font-bold mx-1 text-foreground dark:text-foreground-dark">:</Text>
                        <WheelPicker
                          data={MINUTES}
                          selectedIndex={MINUTES.indexOf(String(pickerMinute).padStart(2, '0'))}
                          onChange={(i) => setPickerMinute(parseInt(MINUTES[i], 10))}
                          width={64}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {reminders.length === 0 && (
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark mt-2">
              No reminders set
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── CREATE BUTTON ────────────────────────────── */}
      <View className="px-5 pb-6">
        <TouchableOpacity
          onPress={handleCreate}
          activeOpacity={0.8}
          className={`py-4 rounded-2xl items-center ${
            name.trim() ? 'bg-primary dark:bg-primary-dark' : 'bg-muted dark:bg-muted-dark'
          }`}
        >
          <Text className={`text-base font-semibold ${
            name.trim() ? 'text-primary-foreground dark:text-primary-foreground-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'
          }`}>
            {isEditing ? 'Save Changes' : 'Create Habit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
