// services/i18n/multiLanguage.ts - Multi-language selector
import crypto from 'crypto';

export interface Language {
  languageId: string;
  code: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  flag: string;
}

export interface Translation {
  translationId: string;
  languageCode: string;
  key: string;
  value: string;
  context?: string;
  updatedAt: number;
}

export interface UserLanguagePreference {
  userId: string;
  languageCode: string;
  updatedAt: number;
}

export class MultiLanguageService {
  private languages: Map<string, Language> = new Map();
  private translations: Map<string, Translation> = new Map();
  private userPreferences: Map<string, UserLanguagePreference> = new Map();

  constructor() {
    this.initializeLanguages();
    this.initializeTranslations();
  }

  /**
   * Initialize supported languages
   */
  private initializeLanguages(): void {
    const languages: Language[] = [
      {
        languageId: 'en',
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        isActive: true,
        flag: '🇬🇧'
      },
      {
        languageId: 'es',
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        isActive: true,
        flag: '🇪🇸'
      },
      {
        languageId: 'fr',
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        isActive: true,
        flag: '🇫🇷'
      },
      {
        languageId: 'de',
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        direction: 'ltr',
        isActive: true,
        flag: '🇩🇪'
      },
      {
        languageId: 'zh',
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        direction: 'ltr',
        isActive: true,
        flag: '🇨🇳'
      },
      {
        languageId: 'ja',
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        direction: 'ltr',
        isActive: true,
        flag: '🇯🇵'
      },
      {
        languageId: 'ar',
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
        isActive: true,
        flag: '🇸🇦'
      },
      {
        languageId: 'pt',
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        direction: 'ltr',
        isActive: true,
        flag: '🇧🇷'
      },
      {
        languageId: 'ru',
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        direction: 'ltr',
        isActive: true,
        flag: '🇷🇺'
      },
      {
        languageId: 'hi',
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        direction: 'ltr',
        isActive: true,
        flag: '🇮🇳'
      },
      {
        languageId: 'sw',
        code: 'sw',
        name: 'Swahili',
        nativeName: 'Kiswahili',
        direction: 'ltr',
        isActive: true,
        flag: '🇰🇪'
      }
    ];

    for (const language of languages) {
      this.languages.set(language.code, language);
    }
  }

  /**
   * Initialize default translations
   */
  private initializeTranslations(): void {
    const defaultTranslations: { [key: string]: { [lang: string]: string } } = {
      'welcome': {
        en: 'Welcome',
        es: 'Bienvenido',
        fr: 'Bienvenue',
        de: 'Willkommen',
        zh: '欢迎',
        ja: 'ようこそ',
        ar: 'مرحبا',
        pt: 'Bem-vindo',
        ru: 'Добро пожаловать',
        hi: 'स्वागत',
        sw: 'Karibu'
      },
      'dashboard': {
        en: 'Dashboard',
        es: 'Tablero',
        fr: 'Tableau de bord',
        de: 'Dashboard',
        zh: '仪表板',
        ja: 'ダッシュボード',
        ar: 'لوحة القيادة',
        pt: 'Painel',
        ru: 'Панель',
        hi: 'डैशबोर्ड',
        sw: 'Dashibodi'
      },
      'devices': {
        en: 'Devices',
        es: 'Dispositivos',
        fr: 'Appareils',
        de: 'Geräte',
        zh: '设备',
        ja: 'デバイス',
        ar: 'الأجهزة',
        pt: 'Dispositivos',
        ru: 'Устройства',
        hi: 'उपकरण',
        sw: 'Vifaa'
      },
      'track': {
        en: 'Track',
        es: 'Rastrear',
        fr: 'Suivre',
        de: 'Verfolgen',
        zh: '跟踪',
        ja: '追跡',
        ar: 'تتبع',
        pt: 'Rastrear',
        ru: 'Отслеживать',
        hi: 'ट्रैक',
        sw: 'Fuata'
      },
      'alerts': {
        en: 'Alerts',
        es: 'Alertas',
        fr: 'Alertes',
        de: 'Warnungen',
        zh: '警报',
        ja: 'アラート',
        ar: 'تنبيهات',
        pt: 'Alertas',
        ru: 'Оповещения',
        hi: 'चेतावनी',
        sw: 'Matatizo'
      },
      'settings': {
        en: 'Settings',
        es: 'Configuración',
        fr: 'Paramètres',
        de: 'Einstellungen',
        zh: '设置',
        ja: '設定',
        ar: 'الإعدادات',
        pt: 'Configurações',
        ru: 'Настройки',
        hi: 'सेटिंग्स',
        sw: 'Mipangilio'
      },
      'logout': {
        en: 'Logout',
        es: 'Cerrar sesión',
        fr: 'Déconnexion',
        de: 'Abmelden',
        zh: '退出',
        ja: 'ログアウト',
        ar: 'تسجيل الخروج',
        pt: 'Sair',
        ru: 'Выйти',
        hi: 'लॉग आउट',
        sw: 'Ondoka'
      },
      'login': {
        en: 'Login',
        es: 'Iniciar sesión',
        fr: 'Connexion',
        de: 'Anmelden',
        zh: '登录',
        ja: 'ログイン',
        ar: 'تسجيل الدخول',
        pt: 'Entrar',
        ru: 'Войти',
        hi: 'लॉग इन',
        sw: 'Ingia'
      },
      'register': {
        en: 'Register',
        es: 'Registrarse',
        fr: 'S\'inscrire',
        de: 'Registrieren',
        zh: '注册',
        ja: '登録',
        ar: 'التسجيل',
        pt: 'Registrar',
        ru: 'Регистрация',
        hi: 'पंजीकरण',
        sw: 'Jiunge'
      },
      'add_device': {
        en: 'Add Device',
        es: 'Agregar dispositivo',
        fr: 'Ajouter un appareil',
        de: 'Gerät hinzufügen',
        zh: '添加设备',
        ja: 'デバイスを追加',
        ar: 'إضافة جهاز',
        pt: 'Adicionar dispositivo',
        ru: 'Добавить устройство',
        hi: 'डिवाइस जोड़ें',
        sw: 'Ongezaa kifaa'
      }
    };

    for (const [key, translations] of Object.entries(defaultTranslations)) {
      for (const [langCode, value] of Object.entries(translations)) {
        const translationId = crypto.randomBytes(16).toString('hex');
        
        const translation: Translation = {
          translationId,
          languageCode: langCode,
          key,
          value,
          updatedAt: Date.now()
        };

        this.translations.set(`${langCode}:${key}`, translation);
      }
    }
  }

  /**
   * Get all supported languages
   */
  getLanguages(): Language[] {
    return Array.from(this.languages.values()).filter(l => l.isActive);
  }

  /**
   * Get language by code
   */
  getLanguage(code: string): Language | null {
    return this.languages.get(code) || null;
  }

  /**
   * Add translation
   */
  addTranslation(
    languageCode: string,
    key: string,
    value: string,
    context?: string
  ): Translation {
    const translationId = crypto.randomBytes(16).toString('hex');

    const translation: Translation = {
      translationId,
      languageCode,
      key,
      value,
      context,
      updatedAt: Date.now()
    };

    this.translations.set(`${languageCode}:${key}`, translation);
    return translation;
  }

  /**
   * Get translation
   */
  getTranslation(languageCode: string, key: string): string | null {
    const translation = this.translations.get(`${languageCode}:${key}`);
    
    if (translation) {
      return translation.value;
    }

    // Fallback to English
    const englishTranslation = this.translations.get(`en:${key}`);
    if (englishTranslation) {
      return englishTranslation.value;
    }

    return null;
  }

  /**
   * Get translations for language
   */
  getTranslationsForLanguage(languageCode: string): Translation[] {
    return Array.from(this.translations.values())
      .filter(t => t.languageCode === languageCode);
  }

  /**
   * Set user language preference
   */
  setUserLanguage(userId: string, languageCode: string): UserLanguagePreference {
    const language = this.languages.get(languageCode);
    
    if (!language || !language.isActive) {
      throw new Error('Invalid or inactive language');
    }

    const preference: UserLanguagePreference = {
      userId,
      languageCode,
      updatedAt: Date.now()
    };

    this.userPreferences.set(userId, preference);
    return preference;
  }

  /**
   * Get user language preference
   */
  getUserLanguage(userId: string): string {
    const preference = this.userPreferences.get(userId);
    return preference ? preference.languageCode : 'en';
  }

  /**
   * Get all translations for a user (based on their language preference)
   */
  getUserTranslations(userId: string): { [key: string]: string } {
    const languageCode = this.getUserLanguage(userId);
    const translations = this.getTranslationsForLanguage(languageCode);
    
    const result: { [key: string]: string } = {};
    for (const translation of translations) {
      result[translation.key] = translation.value;
    }

    return result;
  }

  /**
   * Update translation
   */
  updateTranslation(languageCode: string, key: string, value: string, context?: string): Translation | null {
    const translation = this.translations.get(`${languageCode}:${key}`);
    
    if (!translation) {
      return null;
    }

    translation.value = value;
    translation.context = context;
    translation.updatedAt = Date.now();

    this.translations.set(`${languageCode}:${key}`, translation);
    return translation;
  }

  /**
   * Delete translation
   */
  deleteTranslation(languageCode: string, key: string): boolean {
    return this.translations.delete(`${languageCode}:${key}`);
  }

  /**
   * Activate language
   */
  activateLanguage(code: string): boolean {
    const language = this.languages.get(code);
    
    if (language) {
      language.isActive = true;
      this.languages.set(code, language);
      return true;
    }

    return false;
  }

  /**
   * Deactivate language
   */
  deactivateLanguage(code: string): boolean {
    const language = this.languages.get(code);
    
    if (language) {
      language.isActive = false;
      this.languages.set(code, language);
      return true;
    }

    return false;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalLanguages: number;
    activeLanguages: number;
    totalTranslations: number;
    translationsByLanguage: { [key: string]: number };
    usersWithPreferences: number;
  } {
    const languages = Array.from(this.languages.values());
    const translations = Array.from(this.translations.values());

    const translationsByLanguage: { [key: string]: number } = {};

    for (const translation of translations) {
      translationsByLanguage[translation.languageCode] = (translationsByLanguage[translation.languageCode] || 0) + 1;
    }

    return {
      totalLanguages: languages.length,
      activeLanguages: languages.filter(l => l.isActive).length,
      totalTranslations: translations.length,
      translationsByLanguage,
      usersWithPreferences: this.userPreferences.size
    };
  }

  /**
   * Export translations
   */
  exportTranslations(languageCode?: string): string {
    const translations = languageCode
      ? this.getTranslationsForLanguage(languageCode)
      : Array.from(this.translations.values());
    
    return JSON.stringify(translations, null, 2);
  }

  /**
   * Import translations
   */
  importTranslations(translations: Translation[]): number {
    let imported = 0;

    for (const translation of translations) {
      const key = `${translation.languageCode}:${translation.key}`;
      if (!this.translations.has(key)) {
        this.translations.set(key, translation);
        imported++;
      }
    }

    return imported;
  }
}

export const multiLanguageService = new MultiLanguageService();
