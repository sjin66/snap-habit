import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface LaunchScreenProps {
  canFinish: boolean;
  onFinished: () => void;
}

export function LaunchScreen({ canFinish, onFinished }: LaunchScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const launchReadyRef = useRef(false);

  useEffect(() => {
    Animated.timing(splashOpacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [splashOpacity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      launchReadyRef.current = true;
      if (!canFinish) return;
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start(onFinished);
    }, 3000);

    return () => clearTimeout(timer);
  }, [canFinish, onFinished, splashOpacity]);

  useEffect(() => {
    if (!canFinish || !launchReadyRef.current) return;
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start(onFinished);
  }, [canFinish, onFinished, splashOpacity]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: splashOpacity,
        }}
      >
        <Image
          source={require('../../assets/app-icon.png')}
          style={{ width: 84, height: 84, borderRadius: 18 }}
        />
        <Text
          style={{
            marginTop: 18,
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: 0.3,
            color: isDark ? '#FFFFFF' : '#000000',
          }}
        >
          SnapHabit
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: isDark ? '#E5E5E5' : '#262626',
          }}
        >
          Small steps, every day.
        </Text>
      </Animated.View>
    </GestureHandlerRootView>
  );
}
