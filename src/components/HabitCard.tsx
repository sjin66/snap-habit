import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
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
    // Bounce animation
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onCheckIn(item.habitId);
  }, [item.isCompleted, item.habitId, onCheckIn, scale]);

  const iconBg = item.isCompleted
    ? item.color + '33'   // 20% opacity of habit color
    : item.color + '22';

  return (
    <Animated.View
      style={[
        styles.card,
        item.isCompleted && styles.cardCompleted,
        { transform: [{ scale }] },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, item.isCompleted && styles.nameCompleted]}>
          {item.name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.streak}>🔥 {streak}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={[styles.status, item.isCompleted && styles.statusDone]}>
            {item.isCompleted ? 'Done' : 'Not done'}
          </Text>
        </View>
      </View>

      {/* Check button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.checkBtn,
          item.isCompleted ? styles.checkBtnDone : styles.checkBtnPending,
        ]}
      >
        <Text style={[styles.checkIcon, item.isCompleted && styles.checkIconDone]}>
          {item.isCompleted ? '✓' : '+'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardCompleted: {
    backgroundColor: '#F0FBF0',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  nameCompleted: {
    color: '#2D6A2D',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streak: {
    fontSize: 13,
    color: '#6C757D',
  },
  dot: {
    fontSize: 13,
    color: '#ADB5BD',
  },
  status: {
    fontSize: 13,
    color: '#6C757D',
  },
  statusDone: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  checkBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnPending: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  checkBtnDone: {
    backgroundColor: '#4CAF50',
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  checkIconDone: {
    color: '#fff',
  },
});
