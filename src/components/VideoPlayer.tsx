import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { Subtitle } from '../utils/subtitles';
import SubtitleDisplay from './SubtitleDisplay';

interface VideoPlayerProps {
  videoId: string;
  subtitles: Subtitle[];
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  subtitles, 
  onTimeUpdate 
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<YoutubeIframeRef>(null);

  const screenWidth = Dimensions.get('window').width;
  const playerHeight = (screenWidth * 9) / 16;

  const onStateChange = useCallback((state: string) => {
    switch (state) {
      case 'ended':
      case 'paused':
        setIsPlaying(false);
        break;
      case 'playing':
        setIsPlaying(true);
        break;
      case 'error':
        setError('動画の読み込みに失敗しました');
        break;
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying && playerRef.current) {
      intervalId = setInterval(async () => {
        try {
          const currentTime = await playerRef.current?.getCurrentTime();
          if (currentTime !== undefined) {
            setCurrentTime(currentTime);
            onTimeUpdate?.(currentTime);

            const currentSub = subtitles.find(
              sub => currentTime >= sub.startTime && currentTime < sub.endTime
            );

            if (currentSub?.id !== currentSubtitle?.id) {
              setCurrentSubtitle(currentSub || null);
            }
          }
        } catch (error) {
          // エラーは静かに処理
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, subtitles, currentSubtitle, onTimeUpdate]);

  const handleTimeChange = async (time: number) => {
    if (playerRef.current) {
      await playerRef.current.seekTo(time, true);
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
      <View style={styles.playerSection}>
        <YoutubePlayer
          ref={playerRef}
          height={playerHeight}
          play={isPlaying}
          videoId={videoId}
          onChangeState={onStateChange}
          webViewProps={{
            allowsFullscreenVideo: true,
            allowsInlineMediaPlayback: true,
          }}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
          }}
        />
      </View>

      <View style={[styles.subtitlesContainer, { marginTop: playerHeight }]}>
        <SubtitleDisplay 
          currentSubtitle={currentSubtitle}
          subtitles={subtitles}
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  playerSection: {
    width: '100%',
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  subtitlesContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
});

export default VideoPlayer;