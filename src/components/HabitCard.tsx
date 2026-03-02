import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { TodayHabitItem } from '../types/habit';

interface Props {
  item: TodayHabitItem;
  streak: number;
  onCheckIn: (habitId: string) => void;
}

export function HabitCard({ item, streak, onCheckIn }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const navigation = useNavigation<any>();

  const handlePress = useCallback(() => {
    if (item.isCompleted) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onCheckIn(item.habitId);
  }, [item.isCompleted, item.habitId, onCheckIn, scale]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('HabitDetail', { habitId: item.habitId })}
    >
    <Animated.View
      className={`
        flex-row items-center rounded-2xl py-4 px-4 mx-5 shadow-sm border
        ${item.isCompleted
          ? 'bg-secondary dark:bg-secondary-dark border-border dark:border-border-dark'
          : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
        }
      `}
      style={{ transform: [{ scale }] }}
    >
      {/* Icon */}
      <View
        className="w-[52px] h-[52px] rounded-[14px] justify-center items-center mr-3.5"
        style={{ backgroundColor: item.color + (item.isCompleted ? '33' : '15') }}
      >
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          className={`text-base font-semibold mb-1 ${
            item.isCompleted
              ? 'text-muted-foreground dark:text-muted-foreground-dark'
              : 'text-foreground dark:text-foreground-dark'
          }`}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-[13px] text-muted-foreground dark:text-muted-foreground-dark">
            🔥 {streak}
          </Text>
          <Text className="text-[13px] text-muted-foreground dark:text-muted-foreground-dark"> · </Text>
          <Text
            className={`text-[13px] ${
              item.isCompleted
                ? 'text-foreground dark:text-foreground-dark font-semibold'
                : 'text-muted-foreground dark:text-muted-foreground-dark'
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
            ? 'bg-primary dark:bg-primary-dark'
            : 'bg-input dark:bg-input-dark border-[1.5px] border-border dark:border-border-dark'
        }`}
      >
        <Text
          className={`text-lg font-bold ${
            item.isCompleted
              ? 'text-primary-foreground dark:text-primary-foreground-dark'
              : 'text-muted-foreground dark:text-muted-foreground-dark'
          }`}
        >
          {item.isCompleted ? '✓' : '+'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
    </TouchableOpacity>
  );
}
