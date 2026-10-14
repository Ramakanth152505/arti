/**
 * ARTI AI — Music Studio language catalog.
 *
 * A large, extensible catalog of languages with their native-script display
 * names. This catalog is for selection and lyrics; it is deliberately separate
 * from *vocal* capability.
 *
 * Honesty contract: this list does not claim that the music provider can sing
 * every language. `vocalCapability` starts as `unknown` for every language
 * because no provider has declared its vocal languages in this build. The UI
 * shows unsupported/unknown combinations clearly and never silently generates a
 * different language than the one requested.
 */

export interface LanguageDef {
  /** BCP-47-ish code used in prompts. */
  code: string;
  /** English display name. */
  name: string;
  /** Native-script display name, where one exists. */
  native: string;
  /** Writing direction; the UI mirrors RTL lyrics editors. */
  dir: 'ltr' | 'rtl';
  /**
   * Whether the provider can sing in this language. `unknown` until the
   * provider declares its vocal languages — never assumed true.
   */
  vocalCapability: 'declared' | 'unknown';
}

export const MUSIC_LANGUAGES: LanguageDef[] = [
  { code: 'en', name: 'English', native: 'English', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl', vocalCapability: 'unknown' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'es', name: 'Spanish', native: 'Español', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'fr', name: 'French', native: 'Français', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'de', name: 'German', native: 'Deutsch', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'it', name: 'Italian', native: 'Italiano', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'pt', name: 'Portuguese', native: 'Português', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'da', name: 'Danish', native: 'Dansk', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'pl', name: 'Polish', native: 'Polski', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'cs', name: 'Czech', native: 'Čeština', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ro', name: 'Romanian', native: 'Română', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl', vocalCapability: 'unknown' },
  { code: 'fa', name: 'Persian', native: 'فارسی', dir: 'rtl', vocalCapability: 'unknown' },
  { code: 'he', name: 'Hebrew', native: 'עברית', dir: 'rtl', vocalCapability: 'unknown' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ig', name: 'Igbo', native: 'Igbo', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'zh', name: 'Chinese (Mandarin)', native: '中文', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ja', name: 'Japanese', native: '日本語', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ko', name: 'Korean', native: '한국어', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'th', name: 'Thai', native: 'ไทย', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'fil', name: 'Filipino', native: 'Filipino', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာ', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'km', name: 'Khmer', native: 'ខ្មែរ', dir: 'ltr', vocalCapability: 'unknown' },
  { code: 'yo-latn', name: 'Yoruba (Latin)', native: 'Yorùbá', dir: 'ltr', vocalCapability: 'unknown' },
];

export function getLanguage(code: string): LanguageDef | undefined {
  return MUSIC_LANGUAGES.find((l) => l.code === code);
}

export function languageLabel(code: string): string {
  const l = getLanguage(code);
  if (!l) return code || 'unspecified';
  return l.native && l.native !== l.name ? `${l.name} (${l.native})` : l.name;
}

/** Case/diacritic-insensitive search across English and native names. */
export function searchLanguages(query: string): LanguageDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return MUSIC_LANGUAGES;
  return MUSIC_LANGUAGES.filter(
    (l) => l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.includes(q)
  );
}

/**
 * Declare the provider's real vocal languages. `null` (nothing declared) leaves
 * every language `unknown`; a list marks exactly those `declared`. Called only
 * from verified provider capability data — never guessed.
 */
export function languagesWithVocalCapability(declared: string[] | null): LanguageDef[] {
  if (!declared) return MUSIC_LANGUAGES.map((l) => ({ ...l, vocalCapability: 'unknown' as const }));
  const set = new Set(declared);
  return MUSIC_LANGUAGES.map((l) => ({
    ...l,
    vocalCapability: set.has(l.code) ? ('declared' as const) : ('unknown' as const),
  }));
}
