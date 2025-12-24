// app/(tabs)/setting.tsx
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthUser, login, signup } from '../../src/api/authClient';
import { useData } from '../../src/context/AppDataContext';
import { AuthProfile, useSettings } from '../../src/context/SettingsContext';
import { useT } from '../../src/i18n/labels';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

type SettingsSection = 'menu' | 'account' | 'language' | 'about' | 'updates';

export default function SettingsScreen() {
  const { settings, setLanguage, setSyncEmail, setAuthProfile } = useSettings();
  const { reloadFromServer } = useData();
  const t = useT();
  const currentLang = settings.language;
  const authProfile = settings.authProfile;
  const isLoggedIn = !!authProfile;

  const params = useLocalSearchParams<{ section?: string }>();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>('menu');

  // Agar ?section=account hai to direct Account me khole
  useEffect(() => {
    if (params.section === 'account') {
      setActiveSection('account');
    }
  }, [params.section]);

  // -------- Auth form state --------
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupEmailPhone, setSignupEmailPhone] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

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

  // ---- REAL auth handlers ----
  const mapUserToProfile = (user: AuthUser): AuthProfile => ({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    businessName: user.businessName,
  });

  const handleLogin = async () => {
    const identifier = loginUsername.trim();
    if (!identifier || !loginPassword.trim()) {
      Alert.alert('Login', 'Please enter username/email and password.');
      return;
    }

    try {
      const user = await login({
        usernameOrEmail: identifier,
        password: loginPassword,
      });

      const profile = mapUserToProfile(user);
      setAuthProfile(profile);
      setSyncEmail(user.email);
      await reloadFromServer();

      Alert.alert('Welcome', `Hi ${user.username}!`);
      setActiveSection('menu');
    } catch (e: any) {
      console.error('Login failed', e);
      Alert.alert(
        'Login failed',
        e instanceof Error
          ? e.message
          : 'Unable to login. Please check your username/email and password.',
      );
    }
  };

  const handleSignup = async () => {
    if (
      !signupName.trim() ||
      !signupEmailPhone.trim() ||
      !signupUsername.trim() ||
      !signupPassword.trim()
    ) {
      Alert.alert('Sign up', 'Please fill all required fields.');
      return;
    }

    try {
      const user = await signup({
        name: signupName.trim(),
        businessName: signupBusiness.trim() || undefined,
        email: signupEmailPhone.trim(),
        username: signupUsername.trim(),
        password: signupPassword,
      });

      const profile = mapUserToProfile(user);
      setAuthProfile(profile);
      setSyncEmail(user.email);
      await reloadFromServer();

      Alert.alert('Account created', `Hi ${user.username}!`);
      setActiveSection('menu');
    } catch (e: any) {
      console.error('Signup failed', e);
      Alert.alert(
        'Sign up failed',
        e instanceof Error
          ? e.message
          : 'Could not create account. Please try again.',
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Do you really want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setAuthProfile(null);
          setSyncEmail(null);
          await reloadFromServer();
          setActiveSection('menu');
        },
      },
    ]);
  };

  // ---------- SECTION VIEWS ----------

  const renderMenu = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Settings</Text>
      <Text style={styles.sectionHint}>
        Manage your account, language, app info and updates.
      </Text>

      {/* Account / Login */}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => setActiveSection('account')}
      >
        <View>
          <Text style={styles.menuTitle}>
            {isLoggedIn ? 'Account' : 'Login / Sign up'}
          </Text>
          <Text style={styles.menuSubtitle}>
            {isLoggedIn
              ? `Logged in as ${authProfile?.username}`
              : 'Connect your data to an account'}
          </Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Language */}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => setActiveSection('language')}
      >
        <View>
          <Text style={styles.menuTitle}>Language</Text>
          <Text style={styles.menuSubtitle}>
            {currentLang === 'en' ? 'English' : '日本語'}
          </Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* About */}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => setActiveSection('about')}
      >
        <View>
          <Text style={styles.menuTitle}>About</Text>
          <Text style={styles.menuSubtitle}>App info and creator</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Updates */}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => setActiveSection('updates')}
      >
        <View>
          <Text style={styles.menuTitle}>Updates</Text>
          <Text style={styles.menuSubtitle}>
            Version 1.0.0 · Features log (coming soon)
          </Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccount = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>Account</Text>
      </View>

      {isLoggedIn ? (
        <>
          <Text style={styles.infoText}>
            Hi{' '}
            <Text style={{ fontWeight: '600', color: COLORS.dark }}>
              {authProfile?.username}
            </Text>{' '}
            👋
          </Text>
          <Text style={[styles.infoText, { marginTop: 4 }]}>
            This account is used to sync your entries across devices.
          </Text>
          <Text style={[styles.infoText, { marginTop: 4, fontSize: 11 }]}>
            Email: {authProfile?.email}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.smallButton, styles.primaryButton]}
              onPress={handleLogout}
            >
              <Text style={styles.smallButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionHint}>
            Log in to keep your ledger data linked to your account and access it
            from multiple devices.
          </Text>

          {/* Tabs: Login / Sign up */}
          <View style={styles.authTabsRow}>
            <TouchableOpacity
              style={[
                styles.authTab,
                authMode === 'login' && styles.authTabActive,
              ]}
              onPress={() => setAuthMode('login')}
            >
              <Text
                style={[
                  styles.authTabText,
                  authMode === 'login' && styles.authTabTextActive,
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.authTab,
                authMode === 'signup' && styles.authTabActive,
              ]}
              onPress={() => setAuthMode('signup')}
            >
              <Text
                style={[
                  styles.authTabText,
                  authMode === 'signup' && styles.authTabTextActive,
                ]}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'login' ? (
            <>
              <Text style={styles.label}>Username or email</Text>
              <TextInput
                style={styles.input}
                placeholder="your_username or you@example.com"
                placeholderTextColor="#aaaaaa"
                autoCapitalize="none"
                value={loginUsername}
                onChangeText={setLoginUsername}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#aaaaaa"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />

              <TouchableOpacity
                style={[
                  styles.smallButton,
                  styles.primaryButton,
                  { marginTop: 8 },
                ]}
                onPress={handleLogin}
              >
                <Text style={styles.smallButtonText}>Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#aaaaaa"
                value={signupName}
                onChangeText={setSignupName}
              />

              <Text style={styles.label}>Business name (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Your shop / company"
                placeholderTextColor="#aaaaaa"
                value={signupBusiness}
                onChangeText={setSignupBusiness}
              />

              <Text style={styles.label}>Email or phone</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com / +81-90-xxxx-xxxx"
                placeholderTextColor="#aaaaaa"
                value={signupEmailPhone}
                onChangeText={setSignupEmailPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#aaaaaa"
                autoCapitalize="none"
                value={signupUsername}
                onChangeText={setSignupUsername}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#aaaaaa"
                secureTextEntry
                value={signupPassword}
                onChangeText={setSignupPassword}
              />

              <TouchableOpacity
                style={[
                  styles.smallButton,
                  styles.primaryButton,
                  { marginTop: 8 },
                ]}
                onPress={handleSignup}
              >
                <Text style={styles.smallButtonText}>Create account</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </View>
  );

  const renderLanguage = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>Language</Text>
      </View>

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

      {currentLang === 'ja' && (
        <Text style={[styles.infoText, { marginTop: 6 }]}>
          All content might not be translated into Japanese.
        </Text>
      )}
    </View>
  );

  const renderAbout = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>About</Text>
      </View>

      <Text style={styles.infoText}>
        {`This app is designed and developed  and developed by Bikash.\nIt is currently on pre-release version.\nMobiLedger helps you manage your personal and professional transactions, and automatically creates basic accounting books from your daily entries.`}
      </Text>
    </View>
  );

  const renderUpdates = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>Updates</Text>
      </View>

      <Text style={styles.infoText}>
        You are currently using version 1.0.0 of the app.
      </Text>
      <Text style={[styles.infoText, { marginTop: 4 }]}>
        In future, this section will show update notifications and details
        about new features.
      </Text>
    </View>
  );

  // ---------- RENDER ROOT ----------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      {activeSection === 'menu' && renderMenu()}
      {activeSection === 'account' && renderAccount()}
      {activeSection === 'language' && renderLanguage()}
      {activeSection === 'about' && renderAbout()}
      {activeSection === 'updates' && renderUpdates()}
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

  // menu
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  menuSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  menuArrow: {
    marginLeft: 'auto',
    fontSize: 18,
    color: COLORS.muted,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    fontSize: 13,
    color: COLORS.accent,
    marginRight: 8,
  },

  // language
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

  // form stuff
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

  // auth tabs
  authTabsRow: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
    marginBottom: 10,
    marginTop: 8,
  },
  authTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  authTabActive: {
    backgroundColor: COLORS.primary,
  },
  authTabText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  authTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
