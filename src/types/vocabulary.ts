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
  timestamp: number;
  reviewInfo: {
    lastReviewDate: number;
    nextReviewDate: number;
    reviewCount: number;
    correctCount: number;
    level: number;  // 0: 初回学習, 1: 1日後, 2: 3日後, 3: 7日後, 4: 30日後
  };
} 