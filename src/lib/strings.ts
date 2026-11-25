// Minimal UI string table. The site chrome is English by default; the reader
// chrome follows the episode's own language.
export type UiLang = 'en' | 'ar';

const table = {
  play: { en: 'Play', ar: 'تشغيل' },
  pause: { en: 'Pause', ar: 'إيقاف مؤقت' },
  resume: { en: 'Resume', ar: 'متابعة' },
  listen: { en: 'Listen', ar: 'استمع' },
  listenFromHere: { en: 'Listen from here', ar: 'استمع من هنا' },
  sceneOf: { en: 'Scene', ar: 'المشهد' },
  of: { en: 'of', ar: 'من' },
  previousEpisode: { en: 'Previous episode', ar: 'الحلقة السابقة' },
  nextEpisode: { en: 'Next episode', ar: 'الحلقة التالية' },
  tableOfContents: { en: 'Contents', ar: 'المحتويات' },
  readingSettings: { en: 'Reading settings', ar: 'إعدادات القراءة' },
  fontSize: { en: 'Font size', ar: 'حجم الخط' },
  lineSpacing: { en: 'Line spacing', ar: 'تباعد الأسطر' },
  readingWidth: { en: 'Reading width', ar: 'عرض القراءة' },
  theme: { en: 'Theme', ar: 'السمة' },
  themeDark: { en: 'Dark', ar: 'داكن' },
  themeLight: { en: 'Light', ar: 'فاتح' },
  themeSepia: { en: 'Sepia', ar: 'بني فاتح' },
  cinematicMode: { en: 'Cinematic mode', ar: 'الوضع السينمائي' },
  exitCinematic: { en: 'Exit cinematic mode', ar: 'الخروج من الوضع السينمائي' },
  bookmarkThis: { en: 'Bookmark', ar: 'إشارة مرجعية' },
  bookmarked: { en: 'Bookmarked', ar: 'محفوظ' },
  favorite: { en: 'Favorite', ar: 'مفضلة' },
  musicAndEffects: { en: 'Music & effects', ar: 'الموسيقى والمؤثرات' },
  soundOn: { en: 'Sound on', ar: 'تشغيل الصوت' },
  soundOff: { en: 'Sound off', ar: 'إيقاف الصوت' },
  audioUnavailable: { en: 'Audio unavailable for this part', ar: 'الصوت غير متاح لهذا الجزء' },
  minutes: { en: 'min', ar: 'دقيقة' },
  scenes: { en: 'scenes', ar: 'مشهدًا' },
  wordSyncNote: {
    en: 'Word tracking follows the actual recording.',
    ar: 'تظليل الكلمات يتبع توقيت التسجيل الفعلي.'
  },
  spoilerHidden: { en: 'Spoiler - reveal?', ar: 'محتوى محمي من الحرق - كشف؟' },
  reveal: { en: 'Reveal', ar: 'اكشف' },
  markCompleted: { en: 'Mark as completed', ar: 'وضع كمكتملة' },
  completed: { en: 'Completed', ar: 'مكتملة' },
  backToStory: { en: 'All episodes', ar: 'كل الحلقات' }
} as const;

export type StringKey = keyof typeof table;

export function t(lang: UiLang, key: StringKey): string {
  return table[key][lang] ?? table[key].en;
}

export function episodeLang(language?: string): UiLang {
  return language === 'ar' ? 'ar' : 'en';
}
