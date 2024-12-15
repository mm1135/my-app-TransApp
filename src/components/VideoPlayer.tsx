import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import { MaterialIcons } from '@expo/vector-icons';

interface VideoPlayerProps {
  videoId: string;
  subtitles: Subtitle[];
  onTimeUpdate?: (time: number) => void;
}

interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, subtitles, onTimeUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<any>(null);
  const subtitlesScrollViewRef = useRef<ScrollView>(null);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setIsPlaying(false);
    } else if (state === 'playing') {
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    } else if (state === 'error') {
      setError('動画の読み込みに失敗しました');
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSubtitleClick = (subtitle: Subtitle) => {
    // 字幕がクリックされたときの処理
    // 該当時間にシークする
    if (playerRef.current) {
      playerRef.current.seekTo(subtitle.startTime);
    }
  };

  // 字幕の自動スクロールを改善
  useEffect(() => {
    if (currentSubtitle && subtitlesScrollViewRef.current) {
      const yOffset = (currentSubtitle.id - 1) * 80; // 字幕の高さに応じて調整
      subtitlesScrollViewRef.current.scrollTo({
        y: Math.max(0, yOffset - 100), // 現在の字幕が常に見えるように
        animated: true
      });
    }
  }, [currentSubtitle]);

  // 字幕の表示をより正確に
  const onProgress = useCallback((data: { currentTime: number }) => {
    const time = data.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);

    const currentSub = subtitles.find(
      sub => time >= sub.startTime && time < sub.endTime
    );

    if (currentSub?.id !== currentSubtitle?.id) {
      setCurrentSubtitle(currentSub || null);
    }
  }, [subtitles, currentSubtitle, onTimeUpdate]);

  // YoutubePlayerの設定
  const youtubePlayerProps = {
    ref: playerRef,
    height: 300,
    play: isPlaying,
    videoId: videoId,
    onChangeState: onStateChange,
    onProgress: onProgress, // 進行状況の監視を追加
    progressUpdateInterval: 1000, // 1秒ごとに更新
    webViewProps: {
      allowsFullscreenVideo: true,
      allowsInlineMediaPlayback: true,
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 動画プレーヤーエリア */}
      <View style={styles.playerSection}>
        <View style={styles.videoContainer}>
          <YoutubePlayer {...youtubePlayerProps} />
          
          {/* ビデオコントロール */}
          <View style={styles.controls}>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={togglePlaying} style={styles.controlButton}>
                <MaterialIcons 
                  name={isPlaying ? "pause" : "play-arrow"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
                <MaterialIcons 
                  name={isFullscreen ? "fullscreen-exit" : "fullscreen"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* 字幕セクション */}
      <View style={styles.subtitlesSection}>
        <View style={styles.subtitleHeader}>
          <Text style={styles.subtitleHeaderText}>Subtitles</Text>
          <Text style={styles.currentTimeText}>{formatTime(currentTime)}</Text>
        </View>
        <ScrollView 
          ref={subtitlesScrollViewRef}
          style={styles.subtitlesList}
        >
          {subtitles.map((subtitle) => (
            <TouchableOpacity 
              key={subtitle.id}
              style={[
                styles.subtitleItem,
                currentSubtitle?.id === subtitle.id && styles.subtitleItemActive,
                currentTime >= subtitle.startTime && currentTime <= subtitle.endTime && styles.subtitleItemPlaying
              ]}
              onPress={() => handleSubtitleClick(subtitle)}
            >
              <View style={styles.subtitleContent}>
                <View style={styles.subtitleTimeStamp}>
                  <Text style={styles.timeText}>
                    {formatTime(subtitle.startTime)}
                  </Text>
                </View>
                <View style={styles.subtitleTexts}>
                  <Text style={[
                    styles.subtitleText,
                    currentSubtitle?.id === subtitle.id && styles.subtitleTextActive
                  ]}>
                    {subtitle.text}
                  </Text>
                  {subtitle.translation && (
                    <Text style={styles.translationText}>{subtitle.translation}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  playerSection: {
    backgroundColor: '#000',
    width: '100%',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  subtitlesSection: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subtitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  subtitleHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitlesList: {
    flex: 1,
  },
  subtitleItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 16,
  },
  subtitleItemActive: {
    backgroundColor: '#e3f2fd',
  },
  subtitleItemPlaying: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  subtitleContent: {
    flexDirection: 'row',
  },
  subtitleTimeStamp: {
    width: 50,
    marginRight: 12,
  },
  timeText: {
    color: '#666',
    fontSize: 14,
  },
  subtitleTexts: {
    flex: 1,
  },
  subtitleText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  subtitleTextActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  translationText: {
    fontSize: 14,
    color: '#666',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    padding: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  currentTimeText: {
    fontSize: 14,
    color: '#666',
  },
});

export default VideoPlayer;