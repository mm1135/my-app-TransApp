import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import VideoPlayer from '../components/VideoPlayer';
import { fetchSubtitles, Subtitle } from '../utils/subtitles';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPlayer'>;

export default function VideoPlayerScreen({ route, navigation }: Props) {
  const { videoId, startTime = 0 } = route.params;
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

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

  return (
    <View style={styles.container}>
      <VideoPlayer
        videoId={videoId}
        subtitles={subtitles}
        initialTime={startTime}
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