import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Subtitle } from '../utils/subtitles';

interface Props {
  currentSubtitle: Subtitle | null;
  subtitles: Subtitle[];
  currentTime: number;
  onTimeChange: (time: number) => void;
}

export const SubtitleDisplay = ({ currentSubtitle, subtitles, currentTime, onTimeChange }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const ITEM_HEIGHT = 120;
  const SCROLL_OFFSET = 2;

  useEffect(() => {
    if (currentSubtitle && scrollViewRef.current) {
      const targetIndex = Math.max(0, currentSubtitle.id - 1 - SCROLL_OFFSET);
      scrollViewRef.current.scrollTo({
        y: targetIndex * (ITEM_HEIGHT + 8),
        animated: true
      });
    }
  }, [currentSubtitle?.id]);

  const handleSubtitlePress = (startTime: number) => {
    onTimeChange(startTime);
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
    >
      {subtitles.map((subtitle) => {
        const isCurrentlyPlaying = 
          currentTime >= subtitle.startTime && 
          currentTime < subtitle.endTime;

        return (
          <TouchableOpacity
            key={subtitle.id}
            onPress={() => handleSubtitlePress(subtitle.startTime)}
            style={[
              styles.subtitleItem,
              isCurrentlyPlaying && styles.currentSubtitle
            ]}
          >
            <Text style={styles.subtitleText}>{subtitle.text}</Text>
            {subtitle.translation && (
              <Text style={styles.translationText}>{subtitle.translation}</Text>
            )}
            <Text style={styles.timeText}>
              {formatTime(subtitle.startTime)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
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
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subtitleItem: {
    padding: 16,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    height: 120,
    justifyContent: 'space-between',
  },
  currentSubtitle: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#1976d2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    flex: 1,
  },
  translationText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
});

export default SubtitleDisplay;