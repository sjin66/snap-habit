import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import type { TodayHabitItem } from '../types/habit';

interface Props {
  item: TodayHabitItem;
  streak: number;
  onCheckIn: (habitId: string) => void;
}

export function HabitCard({ item, streak, onCheckIn }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (item.isCompleted) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onCheckIn(item.habitId);
  }, [item.isCompleted, item.habitId, onCheckIn, scale]);

  return (
    <Animated.View
      className={`
        flex-row items-center rounded-2xl py-4 px-4 mx-5 shadow-sm
        ${item.isCompleted
          ? 'bg-success-50 dark:bg-green-900/30'
          : 'bg-surface-card dark:bg-gray-800'
        }
      `}
      style={{ transform: [{ scale }] }}
    >
      {/* Icon */}
      <View
        className="w-[52px] h-[52px] rounded-[14px] justify-center items-center mr-3.5"
        style={{ backgroundColor: item.color + (item.isCompleted ? '33' : '22') }}
      >
        <Text className="text-[26px]">{item.icon}</Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          className={`text-base font-semibold mb-1 ${
            item.isCompleted
              ? 'text-success-700 dark:text-green-300'
              : 'text-content dark:text-white'
          }`}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-[13px] text-content-secondary dark:text-gray-400">
            🔥 {streak}
          </Text>
          <Text className="text-[13px] text-gray-400 dark:text-gray-500"> · </Text>
          <Text
            className={`text-[13px] ${
              item.isCompleted
                ? 'text-success font-semibold'
                : 'text-content-secondary dark:text-gray-400'
            }`}
          >
            {item.isCompleted ? 'Done' : 'Not done'}
          </Text>
        </View>
      </View>

      {/* Check button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className={`w-[38px] h-[38px] rounded-full justify-center items-center ${
          item.isCompleted
            ? 'bg-success'
            : 'bg-border-light dark:bg-gray-700 border-[1.5px] border-gray-300 dark:border-gray-600'
        }`}
      >
        <Text
          className={`text-lg font-bold ${
            item.isCompleted
              ? 'text-content-inverse'
              : 'text-content-tertiary dark:text-gray-500'
          }`}
        >
          {item.isCompleted ? '✓' : '+'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
