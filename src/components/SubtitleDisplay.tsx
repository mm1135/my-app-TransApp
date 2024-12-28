import { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Subtitle } from '../utils/subtitles';
import { decodeHtmlEntities } from '../utils/textUtils';
import { translateText } from '../utils/translation';

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
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [loadingTranslations, setLoadingTranslations] = useState<Record<number, boolean>>({});
  const [translationQueue, setTranslationQueue] = useState<number[]>([]);

  const handleTranslation = async (subtitle: Subtitle) => {
    if (!subtitle.translation && 
        !translations[subtitle.id] && 
        !loadingTranslations[subtitle.id] && 
        !translationQueue.includes(subtitle.id)) {
      
      setTranslationQueue(prev => [...prev, subtitle.id]);
    }
  };

  useEffect(() => {
    const processQueue = async () => {
      if (translationQueue.length > 0) {
        const subtitleId = translationQueue[0];
        const subtitle = subtitles.find(s => s.id === subtitleId);
        
        if (subtitle && !translations[subtitleId]) {
          setLoadingTranslations(prev => ({ ...prev, [subtitleId]: true }));
          
          try {
            const translatedText = await translateText(subtitle.text);
            if (translatedText) {
              setTranslations(prev => ({ ...prev, [subtitleId]: translatedText }));
            }
          } finally {
            setLoadingTranslations(prev => ({ ...prev, [subtitleId]: false }));
            setTranslationQueue(prev => prev.slice(1));
          }
        }
      }
    };

    processQueue();
  }, [translationQueue, subtitles]);

  useEffect(() => {
    const visibleSubtitles = subtitles.filter(subtitle => 
      Math.abs(currentTime - subtitle.startTime) < 10 && // 現在時刻の前後10秒の字幕
      !subtitle.translation && // 既存の翻訳がない
      !translations[subtitle.id] && // まだ翻訳していない
      !translationQueue.includes(subtitle.id) // キューに入っていない
    );

    visibleSubtitles.forEach(subtitle => {
      handleTranslation(subtitle);
    });
  }, [currentTime, subtitles]);

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

        const decodedText = decodeHtmlEntities(subtitle.text);
        const translationText = subtitle.translation || translations[subtitle.id];
        const isLoading = loadingTranslations[subtitle.id];

        return (
          <TouchableOpacity
            key={subtitle.id}
            onPress={() => handleSubtitlePress(subtitle.startTime)}
            style={[
              styles.subtitleItem,
              isCurrentlyPlaying && styles.currentSubtitle
            ]}
          >
            <Text style={styles.subtitleText}>{decodedText}</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#666666" />
            ) : (
              translationText && (
                <Text style={styles.translationText}>{translationText}</Text>
              )
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