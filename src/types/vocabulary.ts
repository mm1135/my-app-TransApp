export interface VideoInfo {
  title: string;
  thumbnailUrl: string;
  subtitle: string;
  translatedSubtitle: string;
  videoId: string;
  startTime: number;
}

export interface VocabularyItem {
  word: string;
  japaneseTranslation: string;
  userImage?: string;
  videoInfo: VideoInfo;
} 