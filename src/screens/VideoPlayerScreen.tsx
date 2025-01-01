import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import VideoPlayer from '../components/VideoPlayer';
import { fetchSubtitles, Subtitle } from '../utils/subtitles';
import { recordStudyTime } from '../utils/studyTime';

type VideoPlayerScreenRouteProp = RouteProp<RootStackParamList, 'VideoPlayer'>;

const VideoPlayerScreen: React.FC = () => {
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const lastRecordedTime = useRef<number>(0);
  const recordInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (route.params.videoId) {
      loadSubtitles(route.params.videoId);
    }

    // 1分ごとに学習時間を記録
    recordInterval.current = setInterval(() => {
      const elapsedMinutes = 1;
      recordStudyTime(elapsedMinutes);
    }, 60000); // 1分 = 60000ミリ秒

    return () => {
      if (recordInterval.current) {
        clearInterval(recordInterval.current);
      }
      // 画面を離れるときに残りの時間を記録
      const remainingMinutes = Math.floor((Date.now() - lastRecordedTime.current) / 60000);
      if (remainingMinutes > 0) {
        recordStudyTime(remainingMinutes);
      }
    };
  }, [route.params.videoId]);

  const loadSubtitles = async (videoId: string) => {
    try {
      const subs = await fetchSubtitles(videoId);
      setSubtitles(subs);
    } catch (error) {
      console.error('字幕の読み込みに失敗しました:', error);
    }
  };

  const handleTimeUpdate = (time: number) => {
    lastRecordedTime.current = Date.now();
  };

  return (
    <View style={styles.container}>
      <VideoPlayer
        videoId={route.params.videoId}
        initialTime={route.params.startTime}
        subtitles={subtitles}
        onTimeUpdate={handleTimeUpdate}
        initialPaused={route.params.fromVocabulary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default VideoPlayerScreen; 