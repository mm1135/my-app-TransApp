import { google } from 'googleapis';

const youtube = google.youtube('v3');
const translate = google.translate('v2');

const API_KEY = 'YOUR_YOUTUBE_API_KEY'; // YouTubeのAPIキーを設定

export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
}

interface Caption {
  start: string;
  dur: string;
  text: string;
}

const parseTime = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

export const fetchSubtitles = async (videoId: string): Promise<Subtitle[]> => {
  try {
    // 1. 字幕トラックの一覧を取得
    const captionResponse = await youtube.captions.list({
      key: API_KEY,
      part: ['snippet'],
      videoId: videoId
    });

    if (!captionResponse.data.items?.length) {
      throw new Error('No captions found for this video');
    }

    // 英語の字幕を優先的に探す
    const captionTrack = captionResponse.data.items.find(
      item => item.snippet?.language === 'en'
    ) || captionResponse.data.items[0];

    // 2. 字幕データを取得
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?lang=${captionTrack.snippet?.language}&v=${videoId}&fmt=json3`
    );
    
    const data = await response.json();
    
    // 3. 字幕データを整形
    return data.events
      .filter((event: Caption) => event.text && event.start)
      .map((event: Caption, index: number) => ({
        id: index + 1,
        startTime: parseFloat(event.start),
        endTime: parseFloat(event.start) + parseFloat(event.dur),
        text: event.text.replace(/\n/g, ' '),
        // 必要に応じて翻訳APIを使用して日本語訳を追加することも可能
      }));

  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return []; // エラー時は空の配列を返す
  }
};

// 翻訳機能を追加する場合（Google Cloud Translation APIを使用する例）
const translateText = async (text: string): Promise<string> => {
  try {
    const response = await translate.translations.list({
      key: API_KEY,
      q: [text], // qは配列で渡す必要があります
      target: 'ja', // 翻訳先の言語
    });

    const translation = response.data.translations?.[0]?.translatedText; // 最初の翻訳を取得
    return translation || '';
  } catch (error) {
    console.error('Translation error:', error);
    return '';
  }
}; 