import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const QUOTES = [
  '"One step at a time, you\'re making great progress."',
  '"Every habit you build shapes the person you become."',
  '"Small wins compound into extraordinary results."',
  '"Consistency beats perfection every time."',
];

interface Props {
  completed: number;
  total: number;
}

export function ProgressCard({ completed, total }: Props) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const quote = QUOTES[Math.floor((completed / Math.max(total, 1)) * (QUOTES.length - 1))];

  const widthProgress = useSharedValue(percent);

  useEffect(() => {
    widthProgress.value = withSpring(percent, {
      damping: 18,
      stiffness: 90,
      mass: 0.8,
    });
  }, [percent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value}%`,
  }));

  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-5 mx-5 shadow-sm border border-border dark:border-border-dark">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base">
          <Text className="font-bold text-foreground dark:text-foreground-dark text-base">
            {completed} / {total}
          </Text>
          <Text className="text-muted-foreground dark:text-muted-foreground-dark font-normal">
            {' '}completed
          </Text>
        </Text>
        <Text className="text-base font-bold text-primary dark:text-primary-dark">{percent}%</Text>
      </View>

      {/* Progress bar */}
      <View className="h-1.5 bg-secondary dark:bg-secondary-dark rounded-full mb-3.5 overflow-hidden">
        <Animated.View
          className="h-full bg-primary dark:bg-primary-dark rounded-full"
          style={barStyle}
        />
      </View>

      <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark italic leading-5">
        {quote}
      </Text>
    </View>
  );
}
