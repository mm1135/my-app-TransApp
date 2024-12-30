import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import VideoPlayer from '../components/VideoPlayer';
import { fetchSubtitles, Subtitle } from '../utils/subtitles';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>;

export default function VideoPlayerScreen({ route }: Props) {
  const { videoId, startTime } = route.params;
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [initialTime, setInitialTime] = useState<number>(startTime || 0);

  useEffect(() => {
    const loadSubtitles = async () => {
      try {
        const subs = await fetchSubtitles(videoId);
        setSubtitles(subs);
      } catch (error) {
        console.error('字幕の読み込みに失敗しました:', error);
      }
    };

    loadSubtitles();
  }, [videoId]);

  useEffect(() => {
    if (startTime !== undefined) {
      setInitialTime(startTime);
    }
  }, [startTime]);

  return (
    <View style={styles.container}>
      <VideoPlayer
        videoId={videoId}
        subtitles={subtitles}
        initialTime={initialTime}
        initialPaused={route.params.fromVocabulary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
}); 