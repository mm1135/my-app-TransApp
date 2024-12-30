import { Subtitle } from '../utils/subtitles';
import { NavigatorScreenParams } from '@react-navigation/native';
import { VocabularyItem } from './vocabulary';

export type VideoStackParamList = {
  VideoSelect: undefined;
  VideoLearning: { videoId: string };
  VideoPlayer: {
    videoId: string;
    startTime?: number;
    fromVocabulary?: boolean;
  };
  Review: {
    items: VocabularyItem[];
  };
};

export type RootTabParamList = {
  動画: NavigatorScreenParams<VideoStackParamList>;
  単語帳: undefined;
  設定: undefined;
};

export type RootStackParamList = VideoStackParamList; 