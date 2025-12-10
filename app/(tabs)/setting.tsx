// app/(tabs)/settings.tsx
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../../src/context/AppDataContext'; // 👈 NEW
import { useSettings } from '../../src/context/SettingsContext';
import { useT } from '../../src/i18n/labels';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

export default function SettingsScreen() {
  const { settings, setLanguage, setSyncEmail } = useSettings();
  const { reloadFromServer } = useData();          // 👈 NEW
  const t = useT();
  const currentLang = settings.language;
  const currentEmail = settings.syncEmail ?? '';

  const renderLangChip = (value: 'en' | 'ja', label: string) => {
    const selected = currentLang === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.langChip, selected && styles.langChipSelected]}
        onPress={() => setLanguage(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.langChipText,
            selected && styles.langChipTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleEmailChange = (value: string) => {
    const trimmed = value.trim();
    setSyncEmail(trimmed.length ? trimmed : null);
  };

  const handleRefreshFromCloud = async () => {
    try {
      await reloadFromServer();
      Alert.alert('Cloud sync', 'Latest data loaded from server for this email.');
    } catch (e) {
      Alert.alert(
        'Cloud sync',
        'Failed to reload from server. Please check your network connection.',
      );
    }
  };

  const handleClearLocal = () => {
    Alert.alert(
      'Clear local settings',
      'This will reset language and clear your saved email on this device. Your cloud data on server will NOT be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          style: 'destructive',
          onPress: () => {
            setLanguage('en');
            setSyncEmail(null);
            Alert.alert(
              'Done',
              'Local settings cleared. You can enter a new email anytime.',
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      {/* Language section */}
      <View className="card" style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t('settings.language.title')}
        </Text>
        <Text style={styles.sectionHint}>
          {t('settings.language.hint')}
        </Text>

        <View style={styles.langRow}>
          {renderLangChip('en', 'English')}
          {renderLangChip('ja', '日本語')}
        </View>

        <Text style={styles.currentLangText}>
          {currentLang === 'en'
            ? t('settings.language.current.en')
            : t('settings.language.current.ja')}
        </Text>
        <Text style={styles.infoText}>
          {t('settings.language.info')}
        </Text>
      </View>

      {/* Data & backup section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t('settings.data.title')}
        </Text>
        <Text style={styles.sectionHint}>
          {t('settings.data.hint')}
        </Text>

        <Text style={styles.label}>Cloud ID (your Gmail)</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#aaaaaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={currentEmail}
          onChangeText={handleEmailChange}
        />
        <Text style={styles.infoText}>
          {`Your entries are stored on the server using this email.\nIf you install the app on another phone and enter the same email here, your data will be loaded again.`}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.smallButton, styles.primaryButton]}
            onPress={handleRefreshFromCloud}
          >
            <Text style={styles.smallButtonText}>Refresh from cloud</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, styles.outlineButton]}
            onPress={handleClearLocal}
          >
            <Text style={styles.outlineButtonText}>Clear local</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t('settings.about.title')}
        </Text>
        <Text style={styles.infoText}>
          {`This app is designed and developed by Bikash.\nIt is currently in an early development version.\nLedger helps you manage your personal and professional money, and automatically creates basic accounting books from your daily entries.`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: '#fdf7fb',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 8,
  },

  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  langChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  currentLangText: {
    fontSize: 12,
    color: COLORS.dark,
    marginTop: 4,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 18,
  },

  label: {
    fontSize: 12,
    color: COLORS.dark,
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.dark,
    marginBottom: 6,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  smallButtonText: {
    fontSize: 12,
    color: COLORS.lightBg,
    fontWeight: '500',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    fontSize: 12,
    color: COLORS.dark,
  },
});
