// app/(tabs)/settings.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

const ONBOARDING_KEY = '@ledger_onboarding_seen_v1';

const ONBOARDING_SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to Ledger',
    body: 'Track your personal and business money in one simple app.',
  },
  {
    key: 'entries',
    title: 'Quick Entries',
    body: 'Add cash in / out in seconds and keep your daily flow updated.',
  },
  {
    key: 'books',
    title: 'Automatic Books',
    body: 'Ledger automatically prepares basic accounting books from your entries.',
  },
  {
    key: 'cloud',
    title: 'Cloud Ready',
    body: 'In future versions, you\'ll be able to safely backup and restore your data.',
  },
  {
    key: 'privacy',
    title: 'Your Data, Your Control',
    body: 'Everything is designed for privacy and simple control by you.',
  },
];

export default function SettingsScreen() {
  const { settings, setLanguage } = useSettings();
  const t = useT();
  const currentLang = settings.language;

  // -------- Onboarding tutorial state --------
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingIndex, setOnboardingIndex] = useState(0);

  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.warn('Failed to read onboarding flag', e);
      }
    };
    loadOnboarding();
  }, []);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch (e) {
      console.warn('Failed to save onboarding flag', e);
    }
    setShowOnboarding(false);
  };

  const goNextSlide = () => {
    if (onboardingIndex < ONBOARDING_SLIDES.length - 1) {
      setOnboardingIndex((i) => i + 1);
    } else {
      finishOnboarding();
    }
  };

  const goPrevSlide = () => {
    if (onboardingIndex > 0) {
      setOnboardingIndex((i) => i - 1);
    }
  };

  // -------- Fake auth UI state (frontend only) --------
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountUsername, setAccountUsername] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'collapsed' | 'login' | 'signup'>(
    'collapsed',
  );

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

  // ---- Auth handlers (demo only) ----
  const handleFakeLogin = () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      Alert.alert('Login', 'Please enter username and password.');
      return;
    }
    setIsLoggedIn(true);
    setAccountUsername(loginUsername.trim());
    setAuthMode('collapsed');
    Alert.alert('Welcome', `Hi ${loginUsername.trim()}! (demo login only)`);
  };

  const handleFakeSignup = () => {
    if (
      !signupName.trim() ||
      !signupEmailPhone.trim() ||
      !signupUsername.trim() ||
      !signupPassword.trim()
    ) {
      Alert.alert('Sign up', 'Please fill all required fields.');
      return;
    }
    setIsLoggedIn(true);
    setAccountUsername(signupUsername.trim());
    setAuthMode('collapsed');
    Alert.alert(
      'Account created',
      `Hi ${signupUsername.trim()}! (demo signup only)`,
    );
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
        onPress: () => {
          setIsLoggedIn(false);
          setAccountUsername(null);
          setAuthMode('collapsed');
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
  const currentSlide = ONBOARDING_SLIDES[onboardingIndex];

  return (
    <>
      {/* Onboarding modal (first time only) */}
      <Modal
        visible={showOnboarding}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.onboardingOverlay}>
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingHeaderRow}>
              <Text style={styles.onboardingTitle}>{currentSlide.title}</Text>
              <TouchableOpacity onPress={finishOnboarding}>
                <Text style={styles.onboardingSkip}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.onboardingBody}>
              <Text style={styles.onboardingBodyText}>
                {currentSlide.body}
              </Text>
            </View>

            <View style={styles.onboardingDotsRow}>
              {ONBOARDING_SLIDES.map((s, idx) => (
                <View
                  key={s.key}
                  style={[
                    styles.onboardingDot,
                    idx === onboardingIndex && styles.onboardingDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.onboardingFooterRow}>
              <TouchableOpacity
                disabled={onboardingIndex === 0}
                onPress={goPrevSlide}
                style={[
                  styles.onboardingButton,
                  onboardingIndex === 0 && styles.onboardingButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.onboardingButtonText,
                    onboardingIndex === 0 && styles.onboardingButtonTextDisabled,
                  ]}
                >
                  Prev
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goNextSlide}
                style={[styles.onboardingButton, styles.onboardingPrimaryButton]}
              >
                <Text style={[styles.onboardingButtonText, { color: '#fff' }]}>
                  {onboardingIndex === ONBOARDING_SLIDES.length - 1
                    ? 'Get started'
                    : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main settings content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
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
                </Text>
                {' '}👋
              </Text>
              <Text style={[styles.infoText, { marginTop: 4 }]}>
                This account will be used to sync your data across devices in a
                future version.
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
                Log in to keep your ledger data linked to your account and
                access from multiple devices in the future.
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
                      <Text style={styles.label}>Username</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="your_username"
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
                        style={[styles.smallButton, styles.primaryButton, { marginTop: 8 }]}
                        onPress={handleFakeLogin}
                      >
                        <Text style={styles.smallButtonText}>Login</Text>
                      </TouchableOpacity>

                      <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      <TouchableOpacity
                        style={[styles.oauthButton, { backgroundColor: '#ffffff' }]}
                        onPress={handleGoogleLogin}
                      >
                        <Text style={styles.oauthIcon}>G</Text>
                        <Text style={styles.oauthText}>
                          Sign in with Google
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.oauthButton, { backgroundColor: '#ffffff' }]}
                        onPress={handlePhoneLogin}
                      >
                        <Text style={styles.oauthIcon}>📱</Text>
                        <Text style={styles.oauthText}>
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
                        style={[styles.smallButton, styles.primaryButton, { marginTop: 8 }]}
                        onPress={handleFakeSignup}
                      >
                        <Text style={styles.smallButtonText}>Create account</Text>
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

          {currentLang === 'ja' && (
            <Text style={[styles.infoText, { marginTop: 6 }]}>
              All content might not be translated into Japanese.
            </Text>
          )}
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('settings.about.title')}
          </Text>
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
    </>
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  oauthIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '700',
    fontSize: 13,
  },
  oauthText: {
    fontSize: 13,
    color: COLORS.dark,
  },

  // onboarding
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  onboardingCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  onboardingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    paddingRight: 8,
  },
  onboardingSkip: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  onboardingBody: {
    marginTop: 16,
    marginBottom: 16,
  },
  onboardingBodyText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  onboardingDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  onboardingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
    marginHorizontal: 3,
  },
  onboardingDotActive: {
    backgroundColor: COLORS.primary,
    width: 14,
  },
  onboardingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onboardingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  onboardingPrimaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  onboardingButtonText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  onboardingButtonTextDisabled: {
    color: '#bbb',
  },
  onboardingButtonDisabled: {
    borderColor: '#eee',
  },
});
