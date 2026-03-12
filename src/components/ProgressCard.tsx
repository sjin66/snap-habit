import React, { useEffect, useRef } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { useI18n } from '../i18n';

// Quotes and celebration messages are now provided by i18n

interface Props {
  completed: number;
  total: number;
}

function getTimePeriod(hour: number): 'morning' | 'noon' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  return 'evening';
}

function getPeriodVisual(period: 'morning' | 'noon' | 'afternoon' | 'evening', isDark: boolean) {
  if (period === 'morning') {
    return {
      icon: 'sunny-outline' as const,
      tint: isDark ? '#FAFAFA10' : '#0A0A0A08',
      iconColor: isDark ? '#FAFAFA22' : '#0A0A0A1A',
    };
  }
  if (period === 'noon') {
    return {
      icon: 'sunny' as const,
      tint: isDark ? '#FAFAFA12' : '#0A0A0A09',
      iconColor: isDark ? '#FAFAFA24' : '#0A0A0A1C',
    };
  }
  if (period === 'afternoon') {
    return {
      icon: 'partly-sunny-outline' as const,
      tint: isDark ? '#FAFAFA10' : '#0A0A0A08',
      iconColor: isDark ? '#FAFAFA20' : '#0A0A0A18',
    };
  }
  return {
    icon: 'moon-outline' as const,
    tint: isDark ? '#FAFAFA0F' : '#0A0A0A07',
    iconColor: isDark ? '#FAFAFA1F' : '#0A0A0A17',
  };
}

export function ProgressCard({ completed, total }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useI18n();
  const period = getTimePeriod(new Date().getHours());
  const periodVisual = getPeriodVisual(period, isDark);
  const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  const isAllDone = total > 0 && completed === total;
  const quote = t.quotes[(new Date().getDate() - 1) % t.quotes.length];

  const prevCompletedRef = useRef(completed);
  const celebrationMsgRef = useRef<{ emoji: string; text: string }>(t.celebrationMessages[0]);

  const widthProgress = useSharedValue(percent);
  // Celebration slide: 0 = hidden, 1 = visible
  const celebrationSlide = useSharedValue(0);
  // Bar glow pulse
  const glowOpacity = useSharedValue(0);
  // Percent counter for celebration (animates 0→100 feel)
  const percentDisplay = useSharedValue(percent);

  // Detect the transition from not-all-done → all-done
  const justCompleted = isAllDone && prevCompletedRef.current < total;

  useEffect(() => {
    if (justCompleted) {
      // Pick a random celebration message
      celebrationMsgRef.current = t.celebrationMessages[Math.floor(Math.random() * t.celebrationMessages.length)];

      // Haptic success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 1. Animate progress bar to 100 with a satisfying spring
      widthProgress.value = withSpring(100, {
        damping: 14,
        stiffness: 80,
        mass: 0.6,
      });

      // 2. Glow pulse on the bar
      glowOpacity.value = withDelay(300, withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(0.8, { duration: 300 }),
        withTiming(0, { duration: 600 }),
      ));

      // 3. Slide in celebration card after bar finishes
      celebrationSlide.value = withDelay(500, withSpring(1, {
        damping: 16,
        stiffness: 120,
        mass: 0.7,
      }));

      // 4. Auto-dismiss after a while
      const timer = setTimeout(() => {
        celebrationSlide.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) });
      }, 4000);

      prevCompletedRef.current = completed;
      return () => clearTimeout(timer);
    } else {
      // Normal progress update
      widthProgress.value = withSpring(percent, {
        damping: 18,
        stiffness: 90,
        mass: 0.8,
      });
      // Reset celebration if unchecked
      if (!isAllDone) {
        celebrationSlide.value = withTiming(0, { duration: 200 });
      }
    }
    prevCompletedRef.current = completed;
  }, [completed, total]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Normal content fades out during celebration
  const normalContentStyle = useAnimatedStyle(() => ({
    opacity: 1 - celebrationSlide.value,
  }));

  // Celebration overlay fades/scales in on the same card
  const celebrationOverlayStyle = useAnimatedStyle(() => {
    const scale = 0.9 + celebrationSlide.value * 0.1;
    return {
      opacity: celebrationSlide.value,
      transform: [{ scale }],
    };
  });

  const msg = celebrationMsgRef.current;

  return (
    <View className="mx-5">
      {/* Main progress card */}
      <View className="bg-card dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-border dark:border-border-dark overflow-hidden">
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: periodVisual.tint,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -16,
            top: -20,
            transform: [{ rotate: '-10deg' }],
          }}
        >
          <Ionicons
            name={periodVisual.icon}
            size={112}
            color={periodVisual.iconColor}
          />
        </View>

        {/* Normal progress content */}
        <Animated.View style={normalContentStyle}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base">
              <Text className="font-bold text-foreground dark:text-foreground-dark text-base">
                {completed} / {total}
              </Text>
              <Text className="text-muted-foreground dark:text-muted-foreground-dark font-normal">
                {' '}{t.completed}
              </Text>
            </Text>
            <Text className="text-base font-bold text-primary dark:text-primary-dark">{percent}%</Text>
          </View>

          {/* Progress bar */}
          <View className="h-2 rounded-full overflow-hidden bg-background dark:bg-background-dark">
            <Animated.View
              className="h-full bg-primary dark:bg-primary-dark rounded-full"
              style={barStyle}
            />
            {/* Glow overlay on bar */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#FAFAFA' : '#0A0A0A',
                },
                glowStyle,
              ]}
            />
          </View>

          <Text
            className="mt-3 text-xs italic text-muted-foreground dark:text-muted-foreground-dark"
            numberOfLines={2}
          >
            {quote}
          </Text>
        </Animated.View>

        {/* Celebration overlay — same card, positioned on top */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 18,
            },
            celebrationOverlayStyle,
          ]}
          pointerEvents="none"
        >
          <Text style={{ fontSize: 28, marginRight: 12 }}>{msg.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: isDark ? '#FAFAFA' : '#0A0A0A',
              marginBottom: 2,
            }}>
              {msg.text}
            </Text>
            <Text style={{
              fontSize: 13,
              color: isDark ? '#A1A1A6' : '#8E8E93',
            }}>
              {t.celebrationSubtext}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
