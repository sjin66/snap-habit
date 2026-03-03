import './global.css';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@navigation/RootNavigator';
import { useHabitStore } from '@stores/habitStore';

export default function App() {
  const colorScheme = useColorScheme();
  const initialize = useHabitStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator colorScheme={colorScheme} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
