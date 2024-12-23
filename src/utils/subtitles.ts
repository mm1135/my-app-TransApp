import { DOMParser } from '@xmldom/xmldom';

export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
}

interface CaptionTrack {
  baseUrl: string;
  name: {
    runs: [{
      text: string;
    }];
  };
  languageCode: string;
}

interface CaptionsData {
  playerCaptionsTracklistRenderer: {
    captionTracks: CaptionTrack[];
  };
}

export const fetchSubtitles = async (videoId: string): Promise<Subtitle[]> => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(videoUrl);
    const pageText = await pageResponse.text();

    // captionsデータを探す
    const captionsMatch = pageText.match(/"captions":({.*?playerCaptionsTracklistRenderer.*?}}})/);
    if (!captionsMatch) {
      console.log('No captions data found');
      return [];
    }

    try {
      // baseUrlを抽出する正規表現パターンを修正
      const baseUrlPattern = /{"baseUrl":"([^"]+)","name":{"runs":\[{"text":"[^"]*"}]},"vssId":"\.[^"]*","languageCode":"(en|ja)"/g;
      const matches = [...captionsMatch[1].matchAll(baseUrlPattern)];

      let englishSubtitles: Subtitle[] = [];
      let japaneseSubtitles: Subtitle[] = [];

      // 英語と日本語の字幕を取得
      for (const match of matches) {
        const baseUrl = decodeURIComponent(
          match[1]
            .replace(/\\u0026/g, '&')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
        );
        
        const languageCode = match[2];
        const response = await fetch('https://www.youtube.com' + baseUrl);
        if (!response.ok) continue;

        const text = await response.text();
        if (!text) continue;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const textElements = xmlDoc.getElementsByTagName('text');

        const subtitles = Array.from(textElements).map((element, index) => ({
          id: index + 1,
          startTime: parseFloat(element.getAttribute('start') || '0'),
          endTime: parseFloat(element.getAttribute('dur') || '0') + parseFloat(element.getAttribute('start') || '0'),
          text: element.textContent?.trim().replace(/\n/g, ' ') || '',
        }));

        if (languageCode === 'en') {
          englishSubtitles = subtitles;
        } else if (languageCode === 'ja') {
          japaneseSubtitles = subtitles;
        }
      }

      // 英語の字幕に日本語の翻訳を追加
      const combinedSubtitles = englishSubtitles.map((enSub, index) => ({
        ...enSub,
        translation: japaneseSubtitles[index]?.text || ''
      }));

      return combinedSubtitles;

    } catch (error) {
      console.error('Error processing subtitles:', error);
      return [];
    }

  } catch (error) {
    console.error('Error fetching video page:', error);
    return [];
  }
}; 