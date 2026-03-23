// src/utils/theme.ts
import { useSettings } from '../context/SettingsContext';

export type Theme = 'light' | 'dark';

export const lightColors = {
  bg: '#ffffff',
  card: '#fdf7fb',
  cardBorder: '#e0e0e0',
  primary: '#ac0c79',
  text: '#121212',
  muted: '#777777',
  accent: '#2e9ff5',
  inputBg: '#ffffff',
  inputBorder: '#e0e0e0',
  statCard: '#fafafa',
  rowBg: '#fdfdfd',
  recentChipBg: '#fafafa',
  selectedRowBg: '#fdf0f9',
};

export const darkColors = {
  bg: '#121212',
  card: '#1e1e1e',
  cardBorder: '#333333',
  primary: '#d63fa5',
  text: '#f0f0f0',
  muted: '#aaaaaa',
  accent: '#4eb3ff',
  inputBg: '#2a2a2a',
  inputBorder: '#444444',
  statCard: '#1a1a1a',
  rowBg: '#1e1e1e',
  recentChipBg: '#252525',
  selectedRowBg: '#2d1a27',
};

export type AppColors = typeof lightColors;

export function useTheme(): AppColors {
  const { settings } = useSettings();
  return settings.theme === 'dark' ? darkColors : lightColors;
}
