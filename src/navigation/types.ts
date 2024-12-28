import { Subtitle } from '../utils/subtitles';

export type RootStackParamList = {
  VideoSelect: undefined;
  VideoLearning: { videoId?: string; initialTimestamp?: number };
  VocabularyList: undefined;
  Review: undefined;
  VocabularyTest: undefined;
  Settings: undefined;
  Tutorial: undefined;
  Main: undefined;
  VideoPlayer: {
    videoId: string;
    subtitles: Subtitle[];
  };
}; 