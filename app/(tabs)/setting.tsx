// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import { useT } from '../../src/i18n/labels';
import { apiLogin, apiSignup } from '../../src/storage/apiClient';

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
  const { reloadFromServer } = useData();
  const t = useT();
  const currentLang = settings.language;

  // ---- Auth UI state ----
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountUsername, setAccountUsername] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'collapsed' | 'login' | 'signup'>(
    'collapsed',
  );
  const [submitting, setSubmitting] = useState(false);

  // login
  const [loginUsernameOrEmail, setLoginUsernameOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // signup
  const [signupName, setSignupName] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
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
  const handleLogin = async () => {
    const id = loginUsernameOrEmail.trim();
    const pwd = loginPassword;

    if (!id || !pwd) {
      Alert.alert('Login', 'Please enter username/email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await apiLogin({
        usernameOrEmail: id,
        password: pwd,
      });

      // Link app to this email for all future API calls
      setSyncEmail(user.email);

      setIsLoggedIn(true);
      setAccountUsername(user.username);
      setAuthMode('collapsed');

      // Reload ledgers + entries for this user
      await reloadFromServer();

      Alert.alert('Login', `Welcome back, ${user.username}!`);
    } catch (e: any) {
      console.error('Login error', e);
      Alert.alert(
        'Login failed',
        e?.message?.toString() ?? 'Unable to login. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async () => {
    const name = signupName.trim();
    const biz = signupBusiness.trim();
    const email = signupEmail.trim();
    const username = signupUsername.trim();
    const pwd = signupPassword;

    if (!name || !email || !username || !pwd) {
      Alert.alert(
        'Sign up',
        'Please fill name, email, username and password.',
      );
      return;
    }

    try {
      setSubmitting(true);
      const user = await apiSignup({
        name,
        businessName: biz || undefined,
        email,
        username,
        password: pwd,
      });

      setSyncEmail(user.email);
      setIsLoggedIn(true);
      setAccountUsername(user.username);
      setAuthMode('collapsed');

      await reloadFromServer();

      Alert.alert('Sign up', `Account created. Hi, ${user.username}!`);
    } catch (e: any) {
      console.error('Signup error', e);
      Alert.alert(
        'Sign up failed',
        e?.message?.toString() ?? 'Unable to create account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Google sign-in',
      'Google login will be added in a future version.',
    );
  };

  const handlePhoneLogin = () => {
    Alert.alert(
      'Phone login',
      'Phone number login will be added in a future version.',
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Do you really want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggedIn(false);
          setAccountUsername(null);
          setAuthMode('collapsed');
          setSyncEmail(null);
          try {
            await reloadFromServer();
          } catch {
            // ignore
          }
          Alert.alert('Logout', 'You are logged out on this device.');
        },
      },
    ]);
  };

  const handleSwitchAccount = () => {
    setIsLoggedIn(false);
    setAccountUsername(null);
    setAuthMode('login');
  };

  // ---------- RENDER ----------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      {/* LOGIN / ACCOUNT SECTION */}
      <View style={styles.card}>
        {isLoggedIn ? (
          <>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.infoText}>
              Hi{' '}
              <Text style={{ fontWeight: '600', color: COLORS.dark }}>
                {accountUsername}
              </Text>{' '}
              👋
            </Text>
            <Text style={[styles.infoText, { marginTop: 4 }]}>
              This account is linked to your ledger data on the server. When you
              login on another device with the same account, your entries can be
              restored.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, styles.primaryButton]}
                onPress={handleLogout}
              >
                <Text style={styles.smallButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, styles.outlineButton]}
                onPress={handleSwitchAccount}
              >
                <Text style={styles.outlineButtonText}>Switch account</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Login</Text>
            <Text style={styles.sectionHint}>
              Log in to keep your ledger data linked to your account and access
              from multiple devices.
            </Text>

            {authMode === 'collapsed' && (
              <TouchableOpacity
                style={styles.bigLoginButton}
                onPress={() => setAuthMode('login')}
                activeOpacity={0.8}
              >
                <Text style={styles.bigLoginButtonText}>
                  Log in or sign up
                </Text>
              </TouchableOpacity>
            )}

            {authMode !== 'collapsed' && (
              <View style={styles.authPanel}>
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
                    <Text style={styles.label}>Username or Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="your_username or you@example.com"
                      placeholderTextColor="#aaaaaa"
                      autoCapitalize="none"
                      value={loginUsernameOrEmail}
                      onChangeText={setLoginUsernameOrEmail}
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
                        { marginTop: 8, opacity: submitting ? 0.7 : 1 },
                      ]}
                      onPress={handleLogin}
                      disabled={submitting}
                    >
                      <Text style={styles.smallButtonText}>
                        {submitting ? 'Logging in...' : 'Login'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.oauthButton}
                      onPress={handleGoogleLogin}
                    >
                      <Text style={styles.oauthIcon}>G</Text>
                      <Text style={styles.oauthText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.oauthButton, { backgroundColor: '#ffffff', borderColor: COLORS.border }]}
                      onPress={handlePhoneLogin}
                    >
                      <Text style={[styles.oauthIcon, { color: '#444', backgroundColor: 'transparent', borderWidth: 0 }]}>
                        📱
                      </Text>
                      <Text style={[styles.oauthText, { color: COLORS.dark }]}>
                        Login with phone number
                      </Text>
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

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#aaaaaa"
                      value={signupEmail}
                      onChangeText={setSignupEmail}
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
                        { marginTop: 8, opacity: submitting ? 0.7 : 1 },
                      ]}
                      onPress={handleSignup}
                      disabled={submitting}
                    >
                      <Text style={styles.smallButtonText}>
                        {submitting ? 'Signing up...' : 'Create account'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* LANGUAGE SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
        <Text style={styles.sectionHint}>{t('settings.language.hint')}</Text>

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

      {/* ABOUT SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.about.title')}</Text>
        <Text style={styles.infoText}>
          {`This app is designed and developed by Bikash.\nIt is currently in an early development version.\nLedger helps you manage your personal and professional money, and automatically creates basic accounting books from your daily entries.`}
        </Text>
      </View>

      {/* UPDATES SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Updates</Text>
        <Text style={styles.infoText}>
          You are currently using version 1.0.0 of the app.
        </Text>
        <Text style={[styles.infoText, { marginTop: 4 }]}>
          In future, this section will show update notifications and details
          about new features.
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
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    fontSize: 12,
    color: COLORS.dark,
  },

  bigLoginButton: {
    marginTop: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  bigLoginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  authPanel: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: '#fff',
  },
  authTabsRow: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
    marginBottom: 10,
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

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.muted,
    marginHorizontal: 8,
  },

  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: '#4285F4', // Google blue
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  oauthIcon: {
    marginRight: 8,
    fontWeight: '700',
    fontSize: 15,
    color: '#fff',
  },
  oauthText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
});
