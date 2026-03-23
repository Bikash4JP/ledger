// app/(tabs)/setting.tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthUser, login, signup } from '../../src/api/authClient';
import { useData } from '../../src/context/AppDataContext';
import { AuthProfile, useSettings } from '../../src/context/SettingsContext';
import { useT } from '../../src/i18n/labels';
import { useTheme } from '../../src/utils/theme';
import { CURRENCIES, CurrencyOption } from '../../src/utils/currency';

type SettingsSection = 'menu' | 'account' | 'language' | 'currency' | 'appearance' | 'about' | 'updates';
type Language = 'en' | 'ja';

const UI_TEXT: Record<Language, any> = {
  en: {
    menuHint: 'Manage your account, language, currency, app info and updates.',
    accountTitle: 'Account',
    authTitle: 'Login / Sign up',
    authHint: 'Connect your data to an account',
    languageTitle: 'Language',
    languageHint: 'Change the display language for this app.',
    currencyTitle: 'Currency',
    currencyHint: 'Choose your display currency symbol.',
    appearanceTitle: 'Appearance',
    appearanceHint: 'Switch between light and dark theme.',
    darkModeLabel: 'Dark Mode',
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
    menuHint: 'アカウント、言語、通貨、アプリ情報、アップデートを管理します。',
    accountTitle: 'アカウント',
    authTitle: 'ログイン / 新規登録',
    authHint: 'データをアカウントに紐付ける',
    languageTitle: '表示言語',
    languageHint: 'アプリの表示言語を変更します。',
    currencyTitle: '通貨',
    currencyHint: '表示する通貨記号を選択してください。',
    appearanceTitle: '外観',
    appearanceHint: 'ライトモードとダークモードを切り替えます。',
    darkModeLabel: 'ダークモード',
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
  const { settings, setLanguage, setSyncEmail, setAuthProfile, setCurrency, setTheme } = useSettings();
  const { reloadFromServer } = useData();
  const tGlobal = useT();
  const C = useTheme();
  const currentLang: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[currentLang];
  const isDark = settings.theme === 'dark';

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

  const handleSelectCurrency = (cur: CurrencyOption) => {
    setCurrency(cur);
  };

  const renderLangChip = (value: 'en' | 'ja', label: string) => {
    const selected = currentLang === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.langChip, { borderColor: C.cardBorder }, selected && { backgroundColor: C.primary, borderColor: C.primary }]}
        onPress={() => setLanguage(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.langChipText, { color: C.text }, selected && { color: '#fff', fontWeight: '600' }]}>{label}</Text>
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
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <Text style={[styles.sectionTitle, { color: C.text }]}>{tGlobal('tabs.settings')}</Text>
      <Text style={[styles.sectionHint, { color: C.muted }]}>{t.menuHint}</Text>

      <TouchableOpacity style={[styles.menuRow, { borderBottomColor: C.cardBorder }]} onPress={() => setActiveSection('account')}>
        <View>
          <Text style={[styles.menuTitle, { color: C.text }]}>{isLoggedIn ? t.accountTitle : t.authTitle}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>{isLoggedIn ? `${t.hi} ${authProfile?.username}` : t.authHint}</Text>
        </View>
        <Text style={[styles.menuArrow, { color: C.muted }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuRow, { borderBottomColor: C.cardBorder }]} onPress={() => setActiveSection('language')}>
        <View>
          <Text style={[styles.menuTitle, { color: C.text }]}>{t.languageTitle}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>{currentLang === 'en' ? 'English' : '日本語'}</Text>
        </View>
        <Text style={[styles.menuArrow, { color: C.muted }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuRow, { borderBottomColor: C.cardBorder }]} onPress={() => setActiveSection('currency')}>
        <View>
          <Text style={[styles.menuTitle, { color: C.text }]}>{t.currencyTitle}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>{settings.currency.symbol} {settings.currency.code} · {currentLang === 'en' ? settings.currency.label : settings.currency.labelJa}</Text>
        </View>
        <Text style={[styles.menuArrow, { color: C.muted }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuRow, { borderBottomColor: C.cardBorder }]} onPress={() => setActiveSection('appearance')}>
        <View>
          <Text style={[styles.menuTitle, { color: C.text }]}>{t.appearanceTitle}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>{isDark ? '🌙 Dark' : '☀️ Light'}</Text>
        </View>
        <Text style={[styles.menuArrow, { color: C.muted }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuRow, { borderBottomColor: C.cardBorder }]} onPress={() => setActiveSection('about')}>
        <View>
          <Text style={[styles.menuTitle, { color: C.text }]}>{t.aboutTitle}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>{t.aboutSubtitle}</Text>
        </View>
        <Text style={[styles.menuArrow, { color: C.muted }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuRow, { borderBottomColor: 'transparent' }]} onPress={() => setActiveSection('updates')}>
        <View>
          <Text style={[styles.menuTitle, { color: C.text }]}>{t.updatesTitle}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>{t.updatesSubtitle}</Text>
        </View>
        <Text style={[styles.menuArrow, { color: C.muted }]}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAppearance = () => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={[styles.backText, { color: C.accent }]}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1, color: C.text }]}>{t.appearanceTitle}</Text>
      </View>
      <Text style={[styles.sectionHint, { color: C.muted }]}>{t.appearanceHint}</Text>

      <View style={[styles.menuRow, { borderBottomColor: 'transparent', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuTitle, { color: C.text }]}>{t.darkModeLabel}</Text>
          <Text style={[styles.menuSubtitle, { color: C.muted }]}>
            {isDark ? (currentLang === 'ja' ? 'ダークモード有効' : 'Dark mode enabled') : (currentLang === 'ja' ? 'ライトモード有効' : 'Light mode enabled')}
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
          trackColor={{ false: '#ccc', true: C.primary }}
          thumbColor={isDark ? '#fff' : '#fff'}
        />
      </View>
    </View>
  );

  const renderAccount = () => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={[styles.backText, { color: C.accent }]}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1, color: C.text }]}>{t.accountTitle}</Text>
      </View>

      {isLoggedIn ? (
        <>
          <Text style={[styles.infoText, { color: C.muted }]}>{t.hi} <Text style={{ fontWeight: '600', color: C.text }}>{authProfile?.username}</Text> 👋</Text>
          <Text style={[styles.infoText, { marginTop: 4, color: C.muted }]}>{t.syncInfo}</Text>
          <Text style={[styles.infoText, { marginTop: 4, fontSize: 11, color: C.muted }]}>Email: {authProfile?.email}</Text>
          <View style={styles.buttonRow}><TouchableOpacity style={[styles.smallButton, { backgroundColor: C.primary }]} onPress={handleLogout}><Text style={styles.smallButtonText}>{t.logout}</Text></TouchableOpacity></View>
        </>
      ) : (
        <>
          <Text style={[styles.sectionHint, { color: C.muted }]}>{t.loginPrompt}</Text>
          <View style={[styles.authTabsRow, { borderColor: C.cardBorder }]}>
            <TouchableOpacity style={[styles.authTab, authMode === 'login' && { backgroundColor: C.primary }]} onPress={() => setAuthMode('login')}><Text style={[styles.authTabText, { color: C.text }, authMode === 'login' && { color: '#fff', fontWeight: '600' }]}>{t.loginTab}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.authTab, authMode === 'signup' && { backgroundColor: C.primary }]} onPress={() => setAuthMode('signup')}><Text style={[styles.authTabText, { color: C.text }, authMode === 'signup' && { color: '#fff', fontWeight: '600' }]}>{t.signupTab}</Text></TouchableOpacity>
          </View>
          {authMode === 'login' ? (
            <>
              <Text style={[styles.label, { color: C.text }]}>{t.usernameLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder="username or email" placeholderTextColor={C.muted} autoCapitalize="none" value={loginUsername} onChangeText={setLoginUsername} />
              <Text style={[styles.label, { color: C.text }]}>{t.passwordLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder="••••••••" placeholderTextColor={C.muted} secureTextEntry value={loginPassword} onChangeText={setLoginPassword} />
              <TouchableOpacity style={[styles.smallButton, { backgroundColor: C.primary, marginTop: 8 }]} onPress={handleLogin}><Text style={styles.smallButtonText}>{t.loginTab}</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: C.text }]}>{t.fullNameLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder="Your name" placeholderTextColor={C.muted} value={signupName} onChangeText={setSignupName} />
              <Text style={[styles.label, { color: C.text }]}>{t.businessLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder="Shop / Company" placeholderTextColor={C.muted} value={signupBusiness} onChangeText={setSignupBusiness} />
              <Text style={[styles.label, { color: C.text }]}>{t.emailLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder="you@example.com" placeholderTextColor={C.muted} value={signupEmailPhone} onChangeText={setSignupEmailPhone} keyboardType="email-address" autoCapitalize="none" />
              <Text style={[styles.label, { color: C.text }]}>{t.usernameLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder={t.usernamePrompt} placeholderTextColor={C.muted} autoCapitalize="none" value={signupUsername} onChangeText={setSignupUsername} />
              <Text style={[styles.label, { color: C.text }]}>{t.passwordLabel}</Text>
              <TextInput style={[styles.input, { borderColor: C.inputBorder, backgroundColor: C.inputBg, color: C.text }]} placeholder={t.passwordPrompt} placeholderTextColor={C.muted} secureTextEntry value={signupPassword} onChangeText={setSignupPassword} />
              <TouchableOpacity style={[styles.smallButton, { backgroundColor: C.primary, marginTop: 8 }]} onPress={handleSignup}><Text style={styles.smallButtonText}>{t.createAccount}</Text></TouchableOpacity>
            </>
          )}
        </>
      )}
    </View>
  );

  const renderLanguage = () => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={[styles.backText, { color: C.accent }]}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1, color: C.text }]}>{t.languageTitle}</Text>
      </View>
      <Text style={[styles.sectionHint, { color: C.muted }]}>{t.languageHint}</Text>
      <View style={styles.langRow}>{renderLangChip('en', 'English')}{renderLangChip('ja', '日本語')}</View>
      <Text style={[styles.currentLangText, { color: C.text }]}>{t.currentLangPrefix}{currentLang === 'en' ? 'English' : '日本語'}</Text>
      {currentLang === 'ja' && <Text style={[styles.infoText, { marginTop: 6, color: C.muted }]}>{t.untranslatedWarning}</Text>}
    </View>
  );

  const renderCurrency = () => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={[styles.backText, { color: C.accent }]}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1, color: C.text }]}>{t.currencyTitle}</Text>
      </View>
      <Text style={[styles.sectionHint, { color: C.muted }]}>{t.currencyHint}</Text>

      {CURRENCIES.map((cur) => {
        const selected = settings.currency.code === cur.code;
        return (
          <TouchableOpacity
            key={cur.code}
            style={[styles.currencyRow, { borderColor: 'transparent' }, selected && { backgroundColor: C.selectedRowBg, borderColor: C.primary }]}
            onPress={() => handleSelectCurrency(cur)}
            activeOpacity={0.7}
          >
            <Text style={[styles.currencySymbol, { color: C.text }]}>{cur.symbol}</Text>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyCode, { color: selected ? C.primary : C.text }]}>{cur.code}</Text>
              <Text style={[styles.currencyLabel, { color: C.muted }]}>{currentLang === 'en' ? cur.label : cur.labelJa}</Text>
            </View>
            {selected && <Text style={[styles.currencyCheck, { color: C.primary }]}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderAbout = () => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={[styles.backText, { color: C.accent }]}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1, color: C.text }]}>{t.aboutTitle}</Text>
      </View>
      <Text style={[styles.infoText, { color: C.muted }]}>{t.aboutDescription}</Text>
    </View>
  );

  const renderUpdates = () => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity onPress={() => setActiveSection('menu')}><Text style={[styles.backText, { color: C.accent }]}>{t.back}</Text></TouchableOpacity>
        <Text style={[styles.sectionTitle, { flex: 1, color: C.text }]}>{t.updatesTitle}</Text>
      </View>
      <Text style={[styles.infoText, { color: C.muted }]}>{t.versionInfo}</Text>
      <Text style={[styles.infoText, { marginTop: 4, color: C.muted }]}>{t.futureUpdates}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: C.text }]}>{tGlobal('tabs.settings')}</Text>
        <Text style={[styles.subtitle, { color: C.muted }]}>{t.menuHint}</Text>
      </View>
      {activeSection === 'menu' && renderMenu()}
      {activeSection === 'account' && renderAccount()}
      {activeSection === 'language' && renderLanguage()}
      {activeSection === 'currency' && renderCurrency()}
      {activeSection === 'appearance' && renderAppearance()}
      {activeSection === 'about' && renderAbout()}
      {activeSection === 'updates' && renderUpdates()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  headerRow: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  sectionHint: { fontSize: 11, marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  menuTitle: { fontSize: 14, fontWeight: '500' },
  menuSubtitle: { fontSize: 11, marginTop: 2 },
  menuArrow: { marginLeft: 'auto', fontSize: 18 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 13, marginRight: 8 },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  langChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  langChipText: { fontSize: 13 },
  currentLangText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  infoText: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  label: { fontSize: 12, marginBottom: 4, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 6 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: 8 },
  smallButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  smallButtonText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  authTabsRow: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 2, marginBottom: 10, marginTop: 8 },
  authTab: { flex: 1, paddingVertical: 6, borderRadius: 999, alignItems: 'center' },
  authTabText: { fontSize: 12 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4, borderWidth: 1 },
  currencySymbol: { fontSize: 20, width: 36, textAlign: 'center' },
  currencyInfo: { flex: 1, marginLeft: 8 },
  currencyCode: { fontSize: 14, fontWeight: '600' },
  currencyLabel: { fontSize: 11, marginTop: 1 },
  currencyCheck: { fontSize: 16, fontWeight: '700' },
});