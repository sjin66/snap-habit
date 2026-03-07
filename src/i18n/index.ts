import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import zh from './zh';

export type Language = 'en' | 'zh';
export type Translations = typeof en;

const translations: Record<Language, Translations> = { en, zh };

interface I18nState {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  loadLanguage: () => Promise<void>;
}

const STORAGE_KEY = 'snaphabit_language';

export const useI18n = create<I18nState>((set) => ({
  language: 'en',
  t: en,

  setLanguage: (lang: Language) => {
    set({ language: lang, t: translations[lang] });
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  },

  loadLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'zh')) {
        set({ language: saved, t: translations[saved] });
      }
    } catch {
      // Fallback to default
    }
  },
}));
