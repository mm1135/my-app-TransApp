import { DOMParser } from '@xmldom/xmldom';

export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  translatedText?: string;
  translation?: string;
  isAutoGenerated?: boolean;
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

export const fetchSubtitles = async (videoId: string, maxRetries = 3): Promise<Subtitle[]> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await fetch(videoUrl);
      const pageText = await pageResponse.text();

      // captionsデータを探す
      const captionsMatch = pageText.match(/"captions":({.*?playerCaptionsTracklistRenderer.*?}}})/);
      if (!captionsMatch) {
        console.log(`No captions data found (attempt ${attempt + 1}/${maxRetries})`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 徐々に待ち時間を増やす
          continue;
        }
        return [];
      }

      try {
        // baseUrlを抽出する正規表現パターンを修正（自動生成字幕を含む）
        const baseUrlPattern = /{"baseUrl":"([^"]+)","name":{"runs":\[{"text":"[^"]*"}]},"vssId":"[.a]?[^"]*","languageCode":"(en|ja)"/g;
        const matches = [...captionsMatch[1].matchAll(baseUrlPattern)];

        let englishSubtitles: Subtitle[] = [];
        let japaneseSubtitles: Subtitle[] = [];
        let hasManualEnglishSubtitles = false;
        let hasManualJapaneseSubtitles = false;

        // 英語と日本語の字幕を取得（手動と自動生成の両方）
        console.log('字幕マッチング結果:', matches.length);
        
        for (const match of matches) {
          const baseUrl = decodeURIComponent(
            match[1]
              .replace(/\\u0026/g, '&')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
          );

          const languageCode = match[2];
          const isAutoGenerated = baseUrl.includes('&kind=asr');

          console.log('字幕情報:', {
            languageCode,
            isAutoGenerated,
            baseUrl
          });

          const response = await fetch('https://www.youtube.com' + baseUrl);
          if (!response.ok) {
            console.log('字幕取得失敗:', {
              status: response.status,
              statusText: response.statusText,
              url: baseUrl
            });
            continue;
          }

          const text = await response.text();
          if (!text) {
            console.log('字幕テキストが空です');
            continue;
          }

          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, 'text/xml');
          const textElements = xmlDoc.getElementsByTagName('text');
          console.log('字幕要素数:', textElements.length);

          const subtitles = Array.from(textElements).map((element, index) => ({
            id: index + 1,
            startTime: parseFloat(element.getAttribute('start') || '0'),
            endTime: parseFloat(element.getAttribute('dur') || '0') + parseFloat(element.getAttribute('start') || '0'),
            text: element.textContent?.trim().replace(/\n/g, ' ') || '',
            isAutoGenerated: isAutoGenerated
          }));

          if (languageCode === 'en') {
            if (!isAutoGenerated && !hasManualEnglishSubtitles) {
              console.log('手動英語字幕を使用');
              hasManualEnglishSubtitles = true;
              englishSubtitles = subtitles;
            } else if (isAutoGenerated && !hasManualEnglishSubtitles) {
              console.log('自動生成英語字幕を使用');
              englishSubtitles = subtitles;
            }
          } else if (languageCode === 'ja') {
            console.log('日本語字幕を使用');
            japaneseSubtitles = subtitles;
          }
        }

        if (!englishSubtitles.length) {
          console.log('英語字幕が見つかりませんでした');
        }
        if (!japaneseSubtitles.length) {
          console.log('日本語字幕が見つかりませんでした');
        }

        // 英語の字幕に日本語の翻訳を追加
        const combinedSubtitles = englishSubtitles.map((enSub, index) => ({
          ...enSub,
          translation: japaneseSubtitles[index]?.text || ''
        }));

        return combinedSubtitles;

      } catch (error) {
        console.error('Error processing subtitles:', error);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        return [];
      }

    } catch (error) {
      console.error('Error fetching video page:', error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      return [];
    }
  }
  return [];
}; 