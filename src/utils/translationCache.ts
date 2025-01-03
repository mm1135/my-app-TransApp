import AsyncStorage from '@react-native-async-storage/async-storage';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

const CACHE_KEY = 'translation_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 1週間

export const saveTranslationToCache = async (text: string, translation: string) => {
  try {
    const existingCache = await AsyncStorage.getItem(CACHE_KEY);
    const cache: TranslationCache = existingCache ? JSON.parse(existingCache) : {};
    
    cache[text] = {
      translation,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving translation to cache:', error);
  }
};

export const getTranslationFromCache = async (text: string): Promise<string | null> => {
  try {
    const existingCache = await AsyncStorage.getItem(CACHE_KEY);
    if (!existingCache) return null;
    
    const cache: TranslationCache = JSON.parse(existingCache);
    const cachedItem = cache[text];
    
    if (!cachedItem) return null;
    
    // キャッシュの有効期限をチェック
    if (Date.now() - cachedItem.timestamp > CACHE_EXPIRY) {
      delete cache[text];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    
    return cachedItem.translation;
  } catch (error) {
    console.error('Error getting translation from cache:', error);
    return null;
  }
}; 