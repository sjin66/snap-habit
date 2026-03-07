import './global.css';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@navigation/RootNavigator';
import { useHabitStore } from '@stores/habitStore';
import { useI18n } from './src/i18n';

export default function App() {
  const colorScheme = useColorScheme();
  const initialize = useHabitStore((s) => s.initialize);
  const loadLanguage = useI18n((s) => s.loadLanguage);

  useEffect(() => {
    initialize();
    loadLanguage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator colorScheme={colorScheme} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
