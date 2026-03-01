import './global.css';
import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@navigation/RootNavigator';

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <RootNavigator colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
}
