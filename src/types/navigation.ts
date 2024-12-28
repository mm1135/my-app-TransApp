import { Subtitle } from '../utils/subtitles';

export type RootStackParamList = {
  VideoSelect: undefined;
  VideoLearning: { videoId: string };
  VocabularyList: undefined;
  Settings: undefined;
  MainTabs: undefined;
  VideoPlayer: {
    videoId: string;
    subtitles: Subtitle[];
    startTime?: number;
  };
}; 