// app/(tabs)/setting.tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
type Language = 'en' | 'ja';

// 🔤 Screen-specific UI text for EN / JA
const UI_TEXT: Record<Language, any> = {
  en: {
    menuHint: 'Manage your account, language, app info and updates.',
    accountTitle: 'Account',
    authTitle: 'Login / Sign up',
    authHint: 'Connect your data to an account',
    languageTitle: 'Language',
    aboutTitle: 'About',
    aboutSubtitle: 'App info and creator',
    updatesTitle: 'Updates',
    updatesSubtitle: 'Version 1.0.0 · Features log',
    back: '‹ Back',
    hi: 'Hi',
    syncInfo: 'This account is used to sync your entries across devices.',
    logout: 'Logout',
    logoutConfirm: 'Do you really want to log out?',
    cancel: 'Cancel',
    loginPrompt: 'Log in to keep your ledger data linked to your account and access it from multiple devices.',
    loginTab: 'Login',
    signupTab: 'Sign up',
    usernameLabel: 'Username or email',
    passwordLabel: 'Password',
    fullNameLabel: 'Full name',
    businessLabel: 'Business name (optional)',
    emailLabel: 'Email or phone',
    usernamePrompt: 'Choose a username',
    passwordPrompt: 'Create a password',
    createAccount: 'Create account',
    loginError: 'Please enter username/email and password.',
    signupError: 'Please fill all required fields.',
    welcome: 'Welcome',
    accountCreated: 'Account created',
    versionInfo: 'You are currently using version 1.0.0 of the app.',
    futureUpdates: 'In future, this section will show update notifications and details about new features.',
    aboutDescription: 'This app is designed and developed by Bikash.\nIt is currently on pre-release version.\nMobiLedger helps you manage your personal and professional transactions, and automatically prepares basic accounting books from your daily entries.',
    currentLangPrefix: 'Current: ',
    untranslatedWarning: 'All content might not be translated into Japanese.',
  },
  ja: {
    menuHint: 'アカウント、言語、アプリ情報、アップデートを管理します。',
    accountTitle: 'アカウント',
    authTitle: 'ログイン / 新規登録',
    authHint: 'データをアカウントに紐付ける',
    languageTitle: '表示言語',
    aboutTitle: 'このアプリについて',
    aboutSubtitle: 'アプリ情報と開発者',
    updatesTitle: 'アップデート',
    updatesSubtitle: 'バージョン 1.0.0 · 更新履歴',
    back: '‹ 戻る',
    hi: 'こんにちは、',
    syncInfo: 'このアカウントを使用して、複数の端末間で仕訳データを同期します。',
    logout: 'ログアウト',
    logoutConfirm: '本当にログアウトしますか？',
    cancel: 'キャンセル',
    loginPrompt: 'ログインすると、帳簿データをアカウントにリンクし、複数のデバイスからアクセスできるようになります。',
    loginTab: 'ログイン',
    signupTab: '新規登録',
    usernameLabel: 'ユーザー名 または メールアドレス',
    passwordLabel: 'パスワード',
    fullNameLabel: '氏名',
    businessLabel: '屋号・会社名（任意）',
    emailLabel: 'メールアドレス または 電話番号',
    usernamePrompt: 'ユーザー名を決めてください',
    passwordPrompt: 'パスワードを作成してください',
    createAccount: 'アカウントを作成',
    loginError: 'ユーザー名とパスワードを入力してください。',
    signupError: '必須項目をすべて入力してください。',
    welcome: 'ようこそ',
    accountCreated: 'アカウント作成完了',
    versionInfo: '現在、バージョン 1.0.0 を使用しています。',
    futureUpdates: '将来的には、このセクションで更新通知や新機能の詳細が表示されます。',
    aboutDescription: 'このアプリは Bikash によって設計・開発されました。\n現在はプレリリース版です。\nMobiLedgerは個人や仕事の取引管理をサポートし、日々の入力から会計帳簿を自動作成します。',
    currentLangPrefix: '現在の言語: ',
    untranslatedWarning: '一部のコンテンツは日本語に翻訳されていない場合があります。',
  }
};

export default function SettingsScreen() {
  const { settings, setLanguage, setSyncEmail, setAuthProfile } = useSettings();
  const { reloadFromServer } = useData();
  const tGlobal = useT(); // From labels.ts
  const currentLang: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[currentLang]; // Local translations
  
  const authProfile = settings.authProfile;
  const isLoggedIn = !!authProfile;

  const params = useLocalSearchParams<{ section?: string }>();
  const [activeSection, setActiveSection] = useState<SettingsSection>('menu');

  useEffect(() => {
    if (params.section === 'account') {
      setActiveSection('account');
    }
  }, [params.section]);

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
        <Text style={[styles.langChipText, selected && styles.langChipTextSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  };

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
      Alert.alert(t.loginTab, t.loginError);
      return;
    }
    try {
      const user = await login({ usernameOrEmail: identifier, password: loginPassword });
      const profile = mapUserToProfile(user);
      setAuthProfile(profile);
      setSyncEmail(user.email);
      await reloadFromServer();
      Alert.alert(t.welcome, `Hi ${user.username}!`);
      setActiveSection('menu');
    } catch (e: any) {
      Alert.alert(t.loginTab, e instanceof Error ? e.message : t.loginError);
    }
  };

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmailPhone.trim() || !signupUsername.trim() || !signupPassword.trim()) {
      Alert.alert(t.signupTab, t.signupError);
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
      Alert.alert(t.accountCreated, `Hi ${user.username}!`);
      setActiveSection('menu');
    } catch (e: any) {
      Alert.alert(t.signupTab, e instanceof Error ? e.message : t.signupError);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t.logout, t.logoutConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logout,
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

  const renderMenu = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{tGlobal('tabs.settings')}</Text>
      <Text style={styles.sectionHint}>{t.menuHint}</Text>

      <TouchableOpacity style={styles.menuRow} onPress={() => setActiveSection('account')}>
        <View>
          <Text style={styles.menuTitle}>{isLoggedIn ? t.accountTitle : t.authTitle}</Text>
          <Text style={styles.menuSubtitle}>{isLoggedIn ? `${t.hi} ${authProfile?.username}` : t.authHint}</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={() => setActiveSection('language')}>
        <View>
          <Text style={styles.menuTitle}>{t.languageTitle}</Text>
          <Text style={styles.menuSubtitle}>{currentLang === 'en' ? 'English' : '日本語'}</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={() => setActiveSection('about')}>
        <View>
          <Text style={styles.menuTitle}>{t.aboutTitle}</Text>
          <Text style={styles.menuSubtitle}>{t.aboutSubtitle}</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={() => setActiveSection('updates')}>
        <View>
          <Text style={styles.menuTitle}>{t.updatesTitle}</Text>
          <Text style={styles.menuSubtitle}>{t.updatesSubtitle}</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccount = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={styles.backText}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.accountTitle}</Text>
      </View>

      {isLoggedIn ? (
        <>
          <Text style={styles.infoText}>{t.hi} <Text style={{ fontWeight: '600', color: COLORS.dark }}>{authProfile?.username}</Text> 👋</Text>
          <Text style={[styles.infoText, { marginTop: 4 }]}>{t.syncInfo}</Text>
          <Text style={[styles.infoText, { marginTop: 4, fontSize: 11 }]}>Email: {authProfile?.email}</Text>
          <View style={styles.buttonRow}><TouchableOpacity style={[styles.smallButton, styles.primaryButton]} onPress={handleLogout}><Text style={styles.smallButtonText}>{t.logout}</Text></TouchableOpacity></View>
        </>
      ) : (
        <>
          <Text style={styles.sectionHint}>{t.loginPrompt}</Text>
          <View style={styles.authTabsRow}>
            <TouchableOpacity style={[styles.authTab, authMode === 'login' && styles.authTabActive]} onPress={() => setAuthMode('login')}><Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>{t.loginTab}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.authTab, authMode === 'signup' && styles.authTabActive]} onPress={() => setAuthMode('signup')}><Text style={[styles.authTabText, authMode === 'signup' && styles.authTabTextActive]}>{t.signupTab}</Text></TouchableOpacity>
          </View>
          {authMode === 'login' ? (
            <>
              <Text style={styles.label}>{t.usernameLabel}</Text>
              <TextInput style={styles.input} placeholder="username or email" placeholderTextColor="#aaaaaa" autoCapitalize="none" value={loginUsername} onChangeText={setLoginUsername} />
              <Text style={styles.label}>{t.passwordLabel}</Text>
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#aaaaaa" secureTextEntry value={loginPassword} onChangeText={setLoginPassword} />
              <TouchableOpacity style={[styles.smallButton, styles.primaryButton, { marginTop: 8 }]} onPress={handleLogin}><Text style={styles.smallButtonText}>{t.loginTab}</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>{t.fullNameLabel}</Text>
              <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#aaaaaa" value={signupName} onChangeText={setSignupName} />
              <Text style={styles.label}>{t.businessLabel}</Text>
              <TextInput style={styles.input} placeholder="Shop / Company" placeholderTextColor="#aaaaaa" value={signupBusiness} onChangeText={setSignupBusiness} />
              <Text style={styles.label}>{t.emailLabel}</Text>
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#aaaaaa" value={signupEmailPhone} onChangeText={setSignupEmailPhone} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>{t.usernameLabel}</Text>
              <TextInput style={styles.input} placeholder={t.usernamePrompt} placeholderTextColor="#aaaaaa" autoCapitalize="none" value={signupUsername} onChangeText={setSignupUsername} />
              <Text style={styles.label}>{t.passwordLabel}</Text>
              <TextInput style={styles.input} placeholder={t.passwordPrompt} placeholderTextColor="#aaaaaa" secureTextEntry value={signupPassword} onChangeText={setSignupPassword} />
              <TouchableOpacity style={[styles.smallButton, styles.primaryButton, { marginTop: 8 }]} onPress={handleSignup}><Text style={styles.smallButtonText}>{t.createAccount}</Text></TouchableOpacity>
            </>
          )}
        </>
      )}
    </View>
  );

  const renderLanguage = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={styles.backText}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.languageTitle}</Text>
      </View>
      <Text style={styles.sectionHint}>{tGlobal('tabs.settings')}</Text>
      <View style={styles.langRow}>{renderLangChip('en', 'English')}{renderLangChip('ja', '日本語')}</View>
      <Text style={styles.currentLangText}>{currentLang === 'en' ? tGlobal('tabs.settings') : tGlobal('tabs.settings')}</Text>
      {currentLang === 'ja' && <Text style={[styles.infoText, { marginTop: 6 }]}>{t.untranslatedWarning}</Text>}
    </View>
  );

  const renderAbout = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={styles.backText}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.aboutTitle}</Text>
      </View>
      <Text style={styles.infoText}>{t.aboutDescription}</Text>
    </View>
  );

  const renderUpdates = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={styles.backText}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.updatesTitle}</Text>
      </View>
      <Text style={styles.infoText}>{t.versionInfo}</Text>
      <Text style={[styles.infoText, { marginTop: 4 }]}>{t.futureUpdates}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{tGlobal('tabs.settings')}</Text>
        <Text style={styles.subtitle}>{tGlobal('tabs.settings')}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.lightBg },
  content: { padding: 16, paddingBottom: 24 },
  headerRow: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '600', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, backgroundColor: '#fdf7fb', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  sectionHint: { fontSize: 11, color: COLORS.muted, marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuTitle: { fontSize: 14, fontWeight: '500', color: COLORS.dark },
  menuSubtitle: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  menuArrow: { marginLeft: 'auto', fontSize: 18, color: COLORS.muted },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 13, color: COLORS.accent, marginRight: 8 },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  langChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  langChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langChipText: { fontSize: 13, color: COLORS.dark },
  langChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  currentLangText: { fontSize: 12, color: COLORS.dark, marginTop: 4, fontWeight: '500' },
  infoText: { fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 18 },
  label: { fontSize: 12, color: COLORS.dark, marginBottom: 4, marginTop: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.dark, marginBottom: 6 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: 8 },
  smallButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  primaryButton: { backgroundColor: COLORS.primary },
  smallButtonText: { fontSize: 12, color: COLORS.lightBg, fontWeight: '500' },
  authTabsRow: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, padding: 2, marginBottom: 10, marginTop: 8 },
  authTab: { flex: 1, paddingVertical: 6, borderRadius: 999, alignItems: 'center' },
  authTabActive: { backgroundColor: COLORS.primary },
  authTabText: { fontSize: 12, color: COLORS.dark },
  authTabTextActive: { color: '#fff', fontWeight: '600' },
});