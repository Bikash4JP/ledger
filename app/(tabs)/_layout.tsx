// app/(tabs)/_layout.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { useSettings } from '../../src/context/SettingsContext';

const TAB_COLORS = {
  bg: '#000000',
  border: '#333333',
  active: '#ffffff',
  inactive: '#aaaaaa',
};

const TAB_LABELS = {
  en: {
    home: 'Home',
    entries: 'Entries',
    ledgers: 'Ledgers',
    reports: 'Reports',
    settings: 'Settings',
  },
  ja: {
    home: 'ホーム',
    entries: '仕訳',
    ledgers: '元帳',
    reports: 'レポート',
    settings: '設定',
  },
} as const;

export default function TabsLayout() {
  const { settings } = useSettings();
  const router = useRouter();
  const lang = settings.language === 'ja' ? 'ja' : 'en';
  const labels = TAB_LABELS[lang];

  const isLoggedIn = !!settings.authProfile;

  const redirectToLoginTab = () => {
    router.push({
      pathname: '/(tabs)/setting',
      params: { section: 'account' },
    } as any);
  };

  // Common listener for protected tabs
  const protectedTabListeners = {
    tabPress: (e: any) => {
      if (!isLoggedIn) {
        e.preventDefault();
        redirectToLoginTab();
      }
    },
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_COLORS.bg,
          borderTopColor: TAB_COLORS.border,
        },
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: labels.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="entries"
        options={{
          title: labels.entries,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
        listeners={protectedTabListeners}
      />
      <Tabs.Screen
        name="ledgers"
        options={{
          title: labels.ledgers,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-table-outline"
              size={size}
              color={color}
            />
          ),
        }}
        listeners={protectedTabListeners}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: labels.reports,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={size}
              color={color}
            />
          ),
        }}
        listeners={protectedTabListeners}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: labels.settings,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
