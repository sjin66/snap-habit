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
import { useI18n } from '../i18n';

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
const UNIT_KEYS = ['times', 'min', 'hours', 'pages', 'glasses', 'steps', 'km', 'ml', 'cal'];

// ─── 时间选择数据 ──────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// ─── 星期几常量 ─────────────────────────────────────────
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
  const { t } = useI18n();

  const unitLabels: Record<string, { label: string; singular: string }> = {
    times: { label: t.unitTimes, singular: t.unitTimeSingular },
    min: { label: t.unitMin, singular: t.unitMin },
    hours: { label: t.unitHours, singular: t.unitHourSingular },
    pages: { label: t.unitPages, singular: t.unitPageSingular },
    glasses: { label: t.unitGlasses, singular: t.unitGlassSingular },
    steps: { label: t.unitSteps, singular: t.unitStepSingular },
    km: { label: t.unitKm, singular: t.unitKm },
    ml: { label: t.unitMl, singular: t.unitMl },
    cal: { label: t.unitCal, singular: t.unitCal },
  };

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
    const unitIndex = UNIT_KEYS.indexOf(unit);
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
        t.notificationsDisabled,
        t.enableNotificationsMsg,
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
          {isEditing ? t.editHabit : t.newHabit}
        </Text>
        <TouchableOpacity onPress={handleCreate} hitSlop={12}>
          <Text className="text-base font-semibold text-accent dark:text-accent-dark">
            {t.done}
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
          {t.basicInfo}
        </Text>
        <View className="mx-5 rounded-2xl overflow-hidden bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          <View className="flex-row items-center px-4 py-3.5 border-b border-border dark:border-border-dark">
            <Text className="text-base font-medium w-16 text-foreground dark:text-foreground-dark">{t.name}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.namePlaceholder}
              placeholderTextColor={isDark ? '#A3A3A3' : '#737373'}
              className="flex-1 text-base text-foreground dark:text-foreground-dark"
            />
          </View>
          <View className="flex-row items-center px-4 py-3.5">
            <Text className="text-base font-medium w-16 text-foreground dark:text-foreground-dark">{t.notes}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.optional}
              placeholderTextColor={isDark ? '#A3A3A3' : '#737373'}
              className="flex-1 text-base text-foreground dark:text-foreground-dark"
            />
          </View>
        </View>

        {/* ── APPEARANCE ─────────────────────────────── */}
        <Text className="text-xs font-semibold tracking-wider px-5 pt-6 pb-2 text-muted-foreground dark:text-muted-foreground-dark">
          {t.appearance}
        </Text>
        <View className="mx-5 rounded-2xl px-4 py-4 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          {/* Category */}
          <Text className="text-sm font-medium mb-3 text-foreground dark:text-foreground-dark">{t.category}</Text>
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
                      {t.categoryName[cat.name] || cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Icon */}
          <Text className="text-sm font-medium mb-3 text-foreground dark:text-foreground-dark">{t.icon}</Text>
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
          <Text className="text-sm font-medium mb-3 text-foreground dark:text-foreground-dark">{t.color}</Text>
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
          {t.goalAndFrequency}
        </Text>
        <View className="mx-5 rounded-2xl px-4 py-5 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          {/* Daily Target */}
          <Text className="text-base font-semibold text-center mb-3 text-foreground dark:text-foreground-dark">
            {t.dailyTarget}
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
                  const u = unitLabels[unit] || { label: unit, singular: unit };
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
              {UNIT_KEYS.map((key) => {
                const isSelected = key === unit;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setUnit(key)}
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
                      {(unitLabels[key] || { label: key }).label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── FREQUENCY ──────────────────────────────── */}
        <View className="mx-5 mt-4 rounded-2xl px-4 py-4 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          {/* Daily / Weekly toggle */}
          <View className={`flex-row rounded-xl gap-3 ${freqType === 'weekly' ? 'mb-4' : ''}`}>
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
                {t.daily}
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
                {t.weekly}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Weekday selector */}
          {freqType === 'weekly' && (
            <View>
              {/* Quick presets */}
              <View className="flex-row mb-3" style={{ gap: 8 }}>
                {([
                  { label: t.weekdays, days: [1, 2, 3, 4, 5] },
                  { label: t.weekends, days: [6, 7] },
                  { label: t.everyDay, days: [1, 2, 3, 4, 5, 6, 7] },
                ] as const).map((preset) => {
                  const isActive = preset.days.length === selectedDays.length &&
                    preset.days.every((d) => selectedDays.includes(d));
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      onPress={() => setSelectedDays([...preset.days])}
                      className={`flex-1 py-1.5 rounded-lg items-center ${
                        isActive ? 'bg-secondary dark:bg-secondary-dark' : 'bg-section-bg dark:bg-section-bg-dark'
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${
                        isActive ? 'text-secondary-foreground dark:text-secondary-foreground-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'
                      }`}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Day circles */}
              <View className="flex-row justify-between">
              {t.weekdayLetters.map((label, idx) => {
                const dayVal = WEEKDAY_VALUES[idx];
                const isActive = selectedDays.includes(dayVal);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => toggleDay(dayVal)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isActive ? 'bg-primary dark:bg-primary-dark' : 'bg-section-bg dark:bg-section-bg-dark'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${
                      isActive ? 'text-primary-foreground dark:text-primary-foreground-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'
                    }`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              </View>
            </View>
          )}
        </View>

        {/* ── REMINDERS ──────────────────────────────── */}
        <View className="mx-5 mt-4 rounded-2xl px-4 py-4 bg-card dark:bg-card-dark border border-border dark:border-border-dark">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={22} color={isDark ? '#B4B4B4' : '#8E8E8E'} />
              <Text className="text-base font-medium ml-2 text-foreground dark:text-foreground-dark">
                {t.reminders}
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
              {t.noRemindersSet}
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
            {isEditing ? t.saveChanges : t.createHabit}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
