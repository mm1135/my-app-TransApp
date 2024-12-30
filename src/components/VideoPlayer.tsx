import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { Subtitle } from '../utils/subtitles';
import { SubtitleDisplay } from './SubtitleDisplay';

export interface VideoPlayerProps {
  videoId: string;
  subtitles: Subtitle[];
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  initialPaused?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  subtitles, 
  initialTime = 0,
  onTimeUpdate,
  initialPaused = false
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(!initialPaused);
  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [isReady, setIsReady] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const playerHeight = (screenWidth * 9) / 16;

  const videoInfo = {
    title: `Video ${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    videoId: videoId
  };

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setIsPlaying(false);
    }
  }, []);

  const onPlayerReady = useCallback(() => {
    setIsReady(true);
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

  useEffect(() => {
    if (isReady && playerRef.current && initialTime > 0) {
      playerRef.current.seekTo(initialTime, true);
    }
  }, [isReady, initialTime]);

  const handleTimeChange = async (time: number) => {
    if (playerRef.current) {
      await playerRef.current.seekTo(time, true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerSection}>
        <YoutubePlayer
          ref={playerRef}
          height={playerHeight}
          play={isPlaying}
          videoId={videoId}
          onChangeState={onStateChange}
          onReady={onPlayerReady}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
            start: initialTime
          }}
        />
      </View>

      <View style={[styles.subtitlesContainer, { marginTop: playerHeight }]}>
        <SubtitleDisplay
          currentSubtitle={currentSubtitle}
          subtitles={subtitles}
          currentTime={currentTime}
          onTimeChange={handleTimeChange}
          videoInfo={videoInfo}
          onWordPress={togglePlayPause}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
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
});

export default VideoPlayer;