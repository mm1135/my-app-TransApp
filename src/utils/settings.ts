import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'app_settings';

export interface AppSettings {
  general: {
    showSubtitles: boolean;
    showTranslation: boolean;
    showVocabularyImage: boolean;
    showVocabularyReviewInfo: boolean;
    showVocabularyExample: boolean;
  };
  review: {
    includeNewWords: boolean;
    includeOverdueWords: boolean;
    includeTodayWords: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    showSubtitles: true,
    showTranslation: true,
    showVocabularyImage: true,
    showVocabularyReviewInfo: true,
    showVocabularyExample: true,
  },
  review: {
    includeNewWords: true,
    includeOverdueWords: true,
    includeTodayWords: true,
  },
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const settings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    return settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(settings) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
    };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const updateGeneralSettings = async (
  settings: Partial<AppSettings['general']>
): Promise<void> => {
  const currentSettings = await getSettings();
  await updateSettings({
    ...currentSettings,
    general: {
      ...currentSettings.general,
      ...settings,
    },
  });
};

export const updateReviewSettings = async (
  settings: Partial<AppSettings['review']>
): Promise<void> => {
  const currentSettings = await getSettings();
  await updateSettings({
    ...currentSettings,
    review: {
      ...currentSettings.review,
      ...settings,
    },
  });
}; 