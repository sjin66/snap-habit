import React from 'react';
import { View, Text, ColorSchemeName } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodayScreen } from '../screens/TodayScreen';

// Placeholder screens
const StatsScreen = () => (
  <View className="flex-1 justify-center items-center bg-surface-secondary dark:bg-gray-950">
    <Text className="text-base text-content-tertiary dark:text-gray-500">Stats (coming soon)</Text>
  </View>
);
const DiscoverScreen = () => (
  <View className="flex-1 justify-center items-center bg-surface-secondary dark:bg-gray-950">
    <Text className="text-base text-content-tertiary dark:text-gray-500">Discover (coming soon)</Text>
  </View>
);
const ProfileScreen = () => (
  <View className="flex-1 justify-center items-center bg-surface-secondary dark:bg-gray-950">
    <Text className="text-base text-content-tertiary dark:text-gray-500">Profile (coming soon)</Text>
  </View>
);

export type RootTabParamList = {
  Today: undefined;
  Stats: undefined;
  Discover: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1.5">
      <Text className={`text-xl mb-0.5 ${focused ? 'opacity-100' : 'opacity-40'}`}>{icon}</Text>
      <Text
        className={`text-2xs font-semibold tracking-wide ${
          focused ? 'text-primary' : 'text-content-tertiary dark:text-gray-500'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

// Light & Dark navigation themes
const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F2F3F7',
    card: '#FFFFFF',
    border: '#E9ECEF',
    primary: '#3B82F6',
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#030712',
    card: '#111827',
    border: '#1F2937',
    primary: '#3B82F6',
  },
};

interface Props {
  colorScheme: ColorSchemeName;
}

export function RootNavigator({ colorScheme }: Props) {
  const isDark = colorScheme === 'dark';

  return (
    <NavigationContainer theme={isDark ? DarkNavTheme : LightNavTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderTopWidth: 0.5,
            borderTopColor: isDark ? '#1F2937' : '#E9ECEF',
            height: 64,
            paddingBottom: 8,
          },
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🔔" label="TODAY" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📊" label="STATS" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🧭" label="DISCOVER" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="👤" label="PROFILE" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
