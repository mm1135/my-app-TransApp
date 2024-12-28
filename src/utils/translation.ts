import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATION_CACHE_PREFIX = 'translation_cache_';
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30日

// テキストの前処理（アポストロフィの変換）
const preprocessText = (text: string): string => {
  return text
    .replace(/'/g, "`");
};

// MyMemory Translation APIを使用した翻訳
const translateWithAPI = async (text: string): Promise<string> => {
  const apiUrl = 'https://api.mymemory.translated.net/get';
  const params = new URLSearchParams({
    q: text,
    langpair: 'en|ja',
    de: 'example@email.com'  // 1日の制限を増やすためのメールアドレス（必要に応じて変更）
  });

  const response = await fetch(`${apiUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Translation failed with status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Translation failed');
  }

  return data.responseData?.translatedText || '';
};

// キャッシュを使用した翻訳
export const translateText = async (text: string): Promise<string> => {
  try {
    // テキストの前処理
    const processedText = preprocessText(text);

    // キャッシュをチェック
    const cacheKey = TRANSLATION_CACHE_PREFIX + processedText;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const { translation, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        if (__DEV__) {
          console.log('Using cached translation for:', processedText);
        }
        return translation;
      }
    }

    // 新しい翻訳を取得
    const translatedText = await translateWithAPI(processedText);
    
    // キャッシュを更新
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      translation: translatedText,
      timestamp: Date.now()
    }));

    // 開発環境の場合はログを出力
    if (__DEV__) {
      console.log('Original text:', text);
      console.log('Processed text:', processedText);
      console.log('Translated text:', translatedText);
    }

    return translatedText;
  } catch (error) {
    if (__DEV__) {
      console.error('Translation error:', error);
    }
    return '';
  }
}; 