import React from 'react';
import { View, Text, ColorSchemeName } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodayScreen } from '../screens/TodayScreen';

// Placeholder screens
const StatsScreen = () => (
  <View className="flex-1 justify-center items-center bg-surface dark:bg-neutral-950">
    <Text className="text-base text-content-tertiary dark:text-neutral-400">Stats (coming soon)</Text>
  </View>
);
const DiscoverScreen = () => (
  <View className="flex-1 justify-center items-center bg-surface dark:bg-neutral-950">
    <Text className="text-base text-content-tertiary dark:text-neutral-400">Discover (coming soon)</Text>
  </View>
);
const ProfileScreen = () => (
  <View className="flex-1 justify-center items-center bg-surface dark:bg-neutral-950">
    <Text className="text-base text-content-tertiary dark:text-neutral-400">Profile (coming soon)</Text>
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
          focused ? 'text-primary dark:text-neutral-50' : 'text-content-tertiary dark:text-neutral-400'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

// Light & Dark navigation themes (shadcn neutral)
const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E5E5',
    primary: '#171717',
    text: '#0A0A0A',
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0A0A0A',
    card: '#0A0A0A',
    border: '#262626',
    primary: '#FAFAFA',
    text: '#FAFAFA',
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
            backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
            borderTopWidth: 0.5,
            borderTopColor: isDark ? '#262626' : '#E5E5E5',
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
