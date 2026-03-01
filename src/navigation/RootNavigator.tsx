import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodayScreen } from '../screens/TodayScreen';

// Placeholder screens
const StatsScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Stats (coming soon)</Text>
  </View>
);
const DiscoverScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Discover (coming soon)</Text>
  </View>
);
const ProfileScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Profile (coming soon)</Text>
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
    <View style={tabStyles.wrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icon}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
    </View>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#E9ECEF',
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

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F3F7',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

const tabStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 6,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.4,
  },
  iconFocused: {
    opacity: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  labelFocused: {
    color: '#3B82F6',
  },
});
