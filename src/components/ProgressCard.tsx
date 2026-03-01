import React from 'react';
import { View, Text } from 'react-native';

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

  return (
    <View className="bg-surface-card dark:bg-gray-800 rounded-2xl p-5 mx-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base">
          <Text className="font-bold text-content dark:text-white text-base">
            {completed} / {total}
          </Text>
          <Text className="text-content-secondary dark:text-gray-400 font-normal">
            {' '}completed
          </Text>
        </Text>
        <Text className="text-base font-bold text-primary">{percent}%</Text>
      </View>

      {/* Progress bar */}
      <View className="h-1.5 bg-border dark:bg-gray-700 rounded-full mb-3.5 overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${percent}%` }}
        />
      </View>

      <Text className="text-sm text-content-secondary dark:text-gray-400 italic leading-5">
        {quote}
      </Text>
    </View>
  );
}
