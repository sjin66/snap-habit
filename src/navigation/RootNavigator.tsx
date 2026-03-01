import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Screens (placeholder imports)
const HomeScreen = () => null;
const StatsScreen = () => null;
const SettingsScreen = () => null;

export type RootTabParamList = {
  Home: undefined;
  Stats: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { borderTopWidth: 0, elevation: 0 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '今日', tabBarIcon: () => <Text>🏠</Text> }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: '统计', tabBarIcon: () => <Text>📊</Text> }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '设置', tabBarIcon: () => <Text>⚙️</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
