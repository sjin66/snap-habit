import React, { useEffect, useRef } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
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

export function ProgressCard({ completed, total }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useI18n();
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isAllDone = total > 0 && completed === total;

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
          <View className="h-1.5 bg-secondary dark:bg-secondary-dark rounded-full overflow-hidden">
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
