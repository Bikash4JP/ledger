// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StatusBar, View } from 'react-native';

import { DataProvider } from '../src/context/AppDataContext';
import { SettingsProvider } from '../src/context/SettingsContext';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Ye View pura app ko status bar ke neeche shift karega */}
      <View
        style={{
          flex: 1,
          paddingTop: STATUS_BAR_HEIGHT,
          backgroundColor: '#000',
        }}
      >
        {/* Yahan se neeche jitne bhi screens / tabs hain
            sab SettingsProvider + DataProvider ke andar aayenge */}
        <SettingsProvider>
          <DataProvider>
            {/* Expo Router ke saare routes yahan inject hote hain,
               including (tabs)/_layout.tsx, entry/[id].tsx, ledger/[id].tsx */}
            <Slot />
          </DataProvider>
        </SettingsProvider>
      </View>
    </SafeAreaProvider>
  );
}
