import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useHabitStore } from '../stores/habitStore';
import { useI18n } from '../i18n';

interface CommonHabit {
  nameKey: string;
  categoryKey: string;
  category: string; // English DB name (matches HabitCategory type)
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  goal: number;
  unit: string;
}

const COMMON_HABITS: CommonHabit[] = [
  { nameKey: 'habitHydration',   categoryKey: 'catHealth',        category: 'Health',       icon: 'water',           color: '#3B82F6', goal: 2000, unit: 'ml' },
  { nameKey: 'habitReading',     categoryKey: 'catLearning',      category: 'Learning',     icon: 'book',            color: '#8B5CF6', goal: 30, unit: 'min' },
  { nameKey: 'habitMeditation',  categoryKey: 'catMind',          category: 'Mind',         icon: 'leaf',            color: '#22C55E', goal: 10, unit: 'min' },
  { nameKey: 'habitExercise',    categoryKey: 'catHealth',        category: 'Health',       icon: 'fitness',         color: '#EF4444', goal: 30, unit: 'min' },
  { nameKey: 'habitJournaling',  categoryKey: 'catMind',          category: 'Mind',         icon: 'pencil',          color: '#F59E0B', goal: 1,  unit: 'times' },
  { nameKey: 'habitDeepWork',    categoryKey: 'catProductivity',  category: 'Productivity', icon: 'flash',           color: '#F97316', goal: 2,  unit: 'hours' },
  { nameKey: 'habitSleepEarly',  categoryKey: 'catHealth',        category: 'Health',       icon: 'moon',            color: '#6366F1', goal: 1,  unit: 'times' },
  { nameKey: 'habitNutrition',   categoryKey: 'catHealth',        category: 'Health',       icon: 'nutrition',       color: '#14B8A6', goal: 3,  unit: 'times' },
];

export function AddHabitScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addHabit } = useHabitStore();
  const { t } = useI18n();

  const handleSelectHabit = (habit: CommonHabit) => {
    (navigation as any).navigate('NewHabit', {
      presetName: (t as any)[habit.nameKey],
      presetIcon: habit.icon,
      presetColor: habit.color,
      presetGoal: habit.goal,
      presetUnit: habit.unit,
      presetCategory: habit.category,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={[]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={24} color={isDark ? '#FAFAFA' : '#0A0A0A'} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          {t.addAHabit}
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <View className="px-5 pt-3 pb-3">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-0.5">
            {t.commonHabits}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t.selectPopularHabit}
          </Text>
        </View>

        {/* Grid */}
        <View className="flex-row flex-wrap px-4">
          {COMMON_HABITS.map((habit, index) => (
            <Animated.View key={habit.nameKey} entering={FadeInDown.delay(index * 80).duration(400)} className="w-1/2 p-1.5">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelectHabit(habit)}
                className="items-center py-6 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark"
              >
                {/* Icon circle */}
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: habit.color + '1A' }}
                >
                  <Ionicons name={habit.icon} size={28} color={habit.color} />
                </View>
                <Text className="text-base font-semibold text-foreground dark:text-foreground-dark mb-0.5">
                  {(t as any)[habit.nameKey]}
                </Text>
                <Text className="text-xs font-medium tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
                  {(t as any)[habit.categoryKey]}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Custom Habit button */}
      <View className="px-5 pb-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('NewHabit', {})}
          className="flex-row items-center justify-center py-4 rounded-2xl bg-primary dark:bg-primary-dark"
        >
          <Ionicons
            name="add-circle"
            size={22}
            color={isDark ? '#0A0A0A' : '#FAFAFA'}
            style={{ marginRight: 8 }}
          />
          <Text className="text-base font-semibold text-primary-foreground dark:text-primary-foreground-dark">
            {t.customHabit}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
