import React from 'react';
import { View, Text, ColorSchemeName } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TodayScreen } from '../screens/TodayScreen';
import { AddHabitScreen } from '../screens/AddHabitScreen';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';
import { NewHabitScreen } from '../screens/NewHabitScreen';
import { StatsScreen } from '../screens/StatsScreen';

// Placeholder screens
const DiscoverScreen = () => (
  <View className="flex-1 justify-center items-center bg-background dark:bg-background-dark">
    <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">Discover (coming soon)</Text>
  </View>
);
const ProfileScreen = () => (
  <View className="flex-1 justify-center items-center bg-background dark:bg-background-dark">
    <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">Profile (coming soon)</Text>
  </View>
);

export type RootTabParamList = {
  Today: undefined;
  Stats: undefined;
  Discover: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  AddHabit: undefined;
  NewHabit: {
    presetName?: string;
    presetIcon?: string;
    presetColor?: string;
    presetGoal?: number;
    presetUnit?: string;
    editHabitId?: string;
  };
  HabitDetail: { habitId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ icon, label, focused, isDark }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; focused: boolean; isDark?: boolean }) {
  return (
    <View className="items-center justify-center">
      <Ionicons name={icon} size={24} color={focused ? (isDark ? '#EBEBEB' : '#141414') : '#A3A3A3'} />
    </View>
  );
}

// Light & Dark navigation themes
const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E5E5',
    primary: '#171717',
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
  },
};

interface Props {
  colorScheme: ColorSchemeName;
}

function TabsNavigator({ isDark }: { isDark: boolean }) {
  return (
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
            <TabIcon icon="home" label="TODAY" focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="bar-chart" label="STATS" focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="compass" label="DISCOVER" focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" label="PROFILE" focused={focused} isDark={isDark} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator({ colorScheme }: Props) {
  const isDark = colorScheme === 'dark';

  return (
    <NavigationContainer theme={isDark ? DarkNavTheme : LightNavTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs">
          {() => <TabsNavigator isDark={isDark} />}
        </Stack.Screen>
        <Stack.Screen
          name="AddHabit"
          component={AddHabitScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="NewHabit"
          component={NewHabitScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="HabitDetail"
          component={HabitDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
