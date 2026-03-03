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

interface CommonHabit {
  name: string;
  category: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  goal: number;
  unit: string;
}

const COMMON_HABITS: CommonHabit[] = [
  { name: 'Hydration',   category: 'HEALTH',      icon: 'water',           color: '#3B82F6', goal: 2000, unit: 'ml' },
  { name: 'Reading',     category: 'MINDSET',      icon: 'book',            color: '#8B5CF6', goal: 30, unit: 'min' },
  { name: 'Meditation',  category: 'MINDFULNESS',  icon: 'leaf',            color: '#22C55E', goal: 10, unit: 'min' },
  { name: 'Exercise',    category: 'FITNESS',       icon: 'fitness',         color: '#EF4444', goal: 30, unit: 'min' },
  { name: 'Journaling',  category: 'GROWTH',        icon: 'pencil',          color: '#F59E0B', goal: 1,  unit: 'times' },
  { name: 'Deep Work',   category: 'FOCUS',         icon: 'flash',           color: '#F97316', goal: 2,  unit: 'hours' },
  { name: 'Sleep Early', category: 'HEALTH',        icon: 'moon',            color: '#6366F1', goal: 1,  unit: 'times' },
  { name: 'Nutrition',   category: 'HEALTH',        icon: 'nutrition',       color: '#14B8A6', goal: 3,  unit: 'times' },
];

export function AddHabitScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addHabit } = useHabitStore();

  const handleSelectHabit = (habit: CommonHabit) => {
    (navigation as any).navigate('NewHabit', {
      presetName: habit.name,
      presetIcon: habit.icon,
      presetColor: habit.color,
      presetGoal: habit.goal,
      presetUnit: habit.unit,
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
          Add a Habit
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
            Common Habits
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Select a popular habit to get started
          </Text>
        </View>

        {/* Grid */}
        <View className="flex-row flex-wrap px-4">
          {COMMON_HABITS.map((habit, index) => (
            <Animated.View key={habit.name} entering={FadeInDown.delay(index * 80).duration(400)} className="w-1/2 p-1.5">
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
                  {habit.name}
                </Text>
                <Text className="text-xs font-medium tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
                  {habit.category}
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
          className="flex-row items-center justify-center py-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark"
        >
          <Ionicons
            name="add-circle"
            size={22}
            color={isDark ? '#FAFAFA' : '#0A0A0A'}
            style={{ marginRight: 8 }}
          />
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Custom Habit
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
