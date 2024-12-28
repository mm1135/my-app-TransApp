import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Alert } from 'react-native';
import LearningApp from './src/components/LearningApp';
import VideoPlayer from './src/components/VideoPlayer';
import { extractYouTubeVideoId } from './src/utils/youtube';
import { fetchSubtitles, Subtitle } from './src/utils/subtitles';

const App: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  const handleLoadVideo = async () => {
    const extractedId = extractYouTubeVideoId(videoUrl);
    if (extractedId) {
      setVideoId(extractedId);
      try {
        const subs = await fetchSubtitles(extractedId);
        if (subs.length > 0) {
          setSubtitles(subs);
        } else {
          Alert.alert('注意', '字幕が見つかりませんでした。');
        }
      } catch (error) {
        Alert.alert('エラー', '字幕の取得に失敗しました。');
      }
    } else {
      Alert.alert('エラー', '有効なYouTube URLを入力してください');
    }
  };

  return (
    <LearningApp>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="YouTube URLを入力してください"
            placeholderTextColor="#999"
          />
          <Button title="動画を読み込む" onPress={handleLoadVideo} />
        </View>
        
        {videoId && (
          <VideoPlayer
            videoId={videoId}
            subtitles={subtitles}
            onTimeUpdate={() => {}}
          />
        )}
      </View>
    </LearningApp>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  inputContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
});

export default App;
