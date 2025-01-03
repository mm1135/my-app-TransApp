import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  const [lastKnownTime, setLastKnownTime] = useState<number>(initialTime);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [isReady, setIsReady] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const playerHeight = (screenWidth * 9) / 16;

  const mergeNearbySubtitles = useCallback((subtitles: Subtitle[]): Subtitle[] => {
    const mergedSubtitles: Subtitle[] = [];
    let currentGroup: Subtitle[] = [];

    const isEndOfSentence = (text: string): boolean => {
      // より詳細な文末判定
      const trimmedText = text.trim();
      // 1. 一般的な文末記号で終わる
      if (/[.!?]$/.test(trimmedText)) return true;
      // 2. 接続詞で始まる場合は文末とみなさない
      if (/^(and|but|or|because|so|however|therefore|thus|moreover|furthermore|additionally)/i.test(trimmedText)) return false;
      // 3. カンマで終わり、次の文が接続詞で始まる場合は文末とみなさない
      if (/,$/.test(trimmedText)) return false;
      // 4. 前置詞で終わる場合は文末とみなさない
      if (/\b(in|on|at|to|for|with|by|from|of|about)\s*$/.test(trimmedText)) return false;
      return false;
    };

    const isCoherentWithNext = (current: string, next: string): boolean => {
      const currentLower = current.toLowerCase().trim();
      const nextLower = next.toLowerCase().trim();
      // 1. 接続詞で始まる場合
      if (/^(and|but|or|because|so)\s/.test(nextLower)) return true;
      // 2. 前置詞で終わる場合
      if (/\b(in|on|at|to|for|with|by|from|of|about)\s*$/.test(currentLower)) return true;
      // 3. 引用符が閉じられていない場合
      const quoteCount = (current.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) return true;
      return false;
    };

    const shouldMergeSubtitle = (currentSub: Subtitle[], nextSub: Subtitle) => {
      // 自動生成字幕以外はマージしない
      if (!nextSub.isAutoGenerated || !currentSub[0].isAutoGenerated) {
        return false;
      }

      const lastSubtitle = currentSub[currentSub.length - 1];
      const timeDiff = nextSub.startTime - lastSubtitle.endTime;
      const currentGroupText = currentSub.map(s => s.text).join(' ');

      // 1. 時間的な連続性をより緩和
      const isTimeContiguous = timeDiff <= 3.0; // 3秒以内の間隔まで許容

      // 2. 文章の連続性チェック
      const isTextContiguous = isCoherentWithNext(lastSubtitle.text, nextSub.text);

      // 3. 文末判定
      const isComplete = isEndOfSentence(lastSubtitle.text);

      // 4. 文字数制限を緩和
      const isWithinLimit = (currentGroupText.length + nextSub.text.length) < 200; // 200文字まで許容

      // 5. 新しい条件：次の字幕が短い場合は積極的にマージ
      const isNextSubtitleShort = nextSub.text.split(' ').length <= 5;

      // 6. 新しい条件：現在のグループが小さい場合は積極的にマージ
      const isCurrentGroupSmall = currentGroupText.split(' ').length < 10;

      // マージ判定の緩和
      if (isComplete && !isNextSubtitleShort) return false; // 完全な文で、次が短くない場合はマージしない

      // より積極的なマージ条件
      if (isTimeContiguous && isWithinLimit) {
        // 以下の条件のいずれかを満たす場合はマージ
        return (
          isTextContiguous ||          // 文章の連続性がある
          isNextSubtitleShort ||       // 次の字幕が短い
          isCurrentGroupSmall ||       // 現在のグループが小さい
          timeDiff <= 1.0              // 時間差が1秒以内
        );
      }

      return false;
    };

    subtitles.forEach((subtitle, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(subtitle);
      } else {
        if (shouldMergeSubtitle(currentGroup, subtitle)) {
          currentGroup.push(subtitle);
        } else {
          if (currentGroup.length > 0) {
            if (currentGroup.length === 1) {
              mergedSubtitles.push(currentGroup[0]);
            } else {
              let mergedText = currentGroup.map(s => s.text).join(' ').trim();
              // 文末記号の適切な追加
              if (!isEndOfSentence(mergedText) && !/[,;]$/.test(mergedText)) {
                mergedText += '.';
              }

              const mergedSubtitle: Subtitle = {
                id: currentGroup[0].id,
                startTime: currentGroup[0].startTime,
                endTime: Math.max(...currentGroup.map(s => s.endTime)),
                text: mergedText,
                translation: currentGroup.map(s => s.translation).filter(Boolean).join(' '),
                isAutoGenerated: true
              };
              mergedSubtitles.push(mergedSubtitle);
            }
          }
          currentGroup = [subtitle];
        }
      }

      if (index === subtitles.length - 1 && currentGroup.length > 0) {
        if (currentGroup.length === 1) {
          mergedSubtitles.push(currentGroup[0]);
        } else {
          let mergedText = currentGroup.map(s => s.text).join(' ').trim();
          if (!isEndOfSentence(mergedText) && !/[,;]$/.test(mergedText)) {
            mergedText += '.';
          }

          const mergedSubtitle: Subtitle = {
            id: currentGroup[0].id,
            startTime: currentGroup[0].startTime,
            endTime: Math.max(...currentGroup.map(s => s.endTime)),
            text: mergedText,
            translation: currentGroup.map(s => s.translation).filter(Boolean).join(' '),
            isAutoGenerated: true
          };
          mergedSubtitles.push(mergedSubtitle);
        }
      }
    });

    return mergedSubtitles;
  }, []);

  const mergedSubtitles = useMemo(() => mergeNearbySubtitles(subtitles), [subtitles, mergeNearbySubtitles]);

  const videoInfo = {
    title: `Video ${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    videoId: videoId
  };

  const togglePlayPause = useCallback(() => {
    console.log('togglePlayPause - current state:', isPlaying);
    // 単語帳からの遷移時は、直接状態を設定する
    if (initialPaused) {
      // 現在の状態に基づいて、次の状態を決定
      const shouldPlay = !isPlaying;
      console.log('togglePlayPause - setting state to:', shouldPlay);
      setIsPlaying(shouldPlay);
    } else {
      // 通常の再生/停止
      const newState = !isPlaying;
      console.log('togglePlayPause - new state:', newState);
      setIsPlaying(newState);
    }
  }, [isPlaying, initialPaused]);

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
          if (currentTime !== undefined && Math.abs(currentTime - lastKnownTime) > 0.05) {
            setCurrentTime(currentTime);
            setLastKnownTime(currentTime);
            onTimeUpdate?.(currentTime);

            const newSubtitle = mergedSubtitles.find(
              sub => currentTime >= sub.startTime && currentTime < sub.endTime
            );
            
            if (newSubtitle?.id !== currentSubtitle?.id) {
              setCurrentSubtitle(newSubtitle || null);
            }
          }
        } catch (error) {
          console.error('Error updating time:', error);
        }
      }, 50);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, mergedSubtitles, currentSubtitle, onTimeUpdate, lastKnownTime]);

  useEffect(() => {
    if (isReady && playerRef.current && initialTime > 0) {
      // 初期時間に移動
      playerRef.current.seekTo(initialTime, true);
      setCurrentTime(initialTime);
      
      // 初期時間に対応する字幕を探して設定
      const findInitialSubtitle = () => {
        const candidates = mergedSubtitles.filter(
          sub => initialTime >= sub.startTime && initialTime < sub.endTime
        );
        
        // 手動字幕を優先
        const manualSubs = candidates.filter(sub => !sub.isAutoGenerated);
        if (manualSubs.length > 0) {
          return manualSubs[0];
        }
        
        // 自動生成字幕の場合
        const autoSubs = candidates.filter(sub => sub.isAutoGenerated);
        if (autoSubs.length > 0) {
          return autoSubs[0];
        }
        
        return null;
      };

      const initialSubtitle = findInitialSubtitle();
      if (initialSubtitle) {
        setCurrentSubtitle(initialSubtitle);
      }
    }
  }, [isReady, initialTime, mergedSubtitles]);

  // 現在時刻の更新を確実にする
  useEffect(() => {
    if (initialTime > 0) {
      setCurrentTime(initialTime);
      onTimeUpdate?.(initialTime);
    }
  }, [initialTime]);

  const handleTimeChange = async (time: number) => {
    if (playerRef.current) {
      await playerRef.current.seekTo(time, true);
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // 時間変更時に対応する字幕を探して設定
      const newSubtitle = mergedSubtitles.find(
        sub => time >= sub.startTime && time < sub.endTime
      );
      if (newSubtitle) {
        setCurrentSubtitle(newSubtitle);
      }
    }
  };

  // 単語帳からの遷移時は、初期状態を再生に設定
  useEffect(() => {
    if (initialPaused) {
      console.log('initialPaused effect - setting initial state to playing');
      setIsPlaying(true);
    }
  }, [initialPaused]);

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
          subtitles={mergedSubtitles}
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