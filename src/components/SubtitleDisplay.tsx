import { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import { Subtitle } from '../utils/subtitles';
import { decodeHtmlEntities } from '../utils/textUtils';
import { translateText } from '../utils/translation';
import { fetchWordMeaning } from '../utils/dictionary';
import { saveVocabularyItem } from '../utils/vocabulary';
import { WordMeaning } from '../types/dictionary';
import { VocabularyItem } from '../types/vocabulary';

interface Props {
  currentSubtitle: Subtitle | null;
  subtitles: Subtitle[];
  currentTime: number;
  onTimeChange: (time: number) => void;
  videoInfo: {
    title: string;
    thumbnailUrl: string;
    videoId: string;
  };
  onWordPress?: () => void;
}

export const SubtitleDisplay = ({ currentSubtitle, subtitles, currentTime, onTimeChange, videoInfo, onWordPress }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const ITEM_HEIGHT = 120;
  const SCROLL_OFFSET = 2;
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [loadingTranslations, setLoadingTranslations] = useState<Record<number, boolean>>({});
  const [translationQueue, setTranslationQueue] = useState<number[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordMeaning, setWordMeaning] = useState<WordMeaning | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      Math.abs(currentTime - subtitle.startTime) < 10 &&
      !subtitle.translation &&
      !translations[subtitle.id] &&
      !translationQueue.includes(subtitle.id)
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
  }, [currentSubtitle?.id, currentTime]);

  const handleSubtitlePress = (startTime: number) => {
    onTimeChange(startTime);
  };

  const handleWordPress = async (word: string) => {
    if (onWordPress) {
      onWordPress();
    }
    
    setSelectedWord(word);
    setShowWordModal(true);
    setIsLoading(true);
    
    try {
      const [meaning, translation] = await Promise.all([
        fetchWordMeaning(word),
        translateText(word)
      ]);

      if (meaning) {
        const meaningData: WordMeaning = {
          definition: meaning.meanings[0]?.definitions[0]?.definition || '',
          japaneseTranslation: translation,
          partOfSpeech: meaning.meanings[0]?.partOfSpeech,
          example: meaning.meanings[0]?.definitions[0]?.example,
        };
        setWordMeaning(meaningData);
      }
    } catch (error) {
      console.error('Error fetching word data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWord = async () => {
    if (selectedWord && wordMeaning && currentSubtitle) {
      const isCurrentSubtitle = 
        currentTime >= currentSubtitle.startTime && 
        currentTime < currentSubtitle.endTime;

      if (!isCurrentSubtitle) {
        Alert.alert('エラー', '単語は現在再生中の字幕からのみ保存できます');
        return;
      }

      try {
        const vocabularyItem: VocabularyItem = {
          word: selectedWord,
          japaneseTranslation: wordMeaning.japaneseTranslation || '',
          videoInfo: {
            title: videoInfo.title,
            thumbnailUrl: videoInfo.thumbnailUrl,
            subtitle: decodeHtmlEntities(currentSubtitle.text),
            translatedSubtitle: translations[currentSubtitle.id] || '',
            videoId: videoInfo.videoId,
            startTime: currentTime
          },
          timestamp: Date.now()
        };
        
        await saveVocabularyItem(vocabularyItem);
        Alert.alert('成功', '単語を保存しました');
        setShowWordModal(false);
      } catch (error) {
        console.error('Error saving word:', error);
        Alert.alert('エラー', '単語の保存に失敗しました');
      }
    }
  };

  const cleanWord = (word: string): string => {
    return word.replace(/[.,!?:;]/g, '').trim();
  };

  const renderTappableText = (text: string, isCurrentlyPlaying: boolean) => {
    const words = text.split(' ');
    return (
      <View style={styles.textContainer}>
        {words.map((word, index) => {
          const cleanedWord = cleanWord(word);
          if (!cleanedWord) return null;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (isCurrentlyPlaying) {
                  handleWordPress(cleanedWord);
                } else {
                  Alert.alert('注意', '単語は現在再生中の字幕からのみ選択できます');
                }
              }}
            >
              <Text style={[
                styles.tappableWord,
                !isCurrentlyPlaying && styles.disabledWord
              ]}>
                {word}{' '}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
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
            {renderTappableText(decodedText, isCurrentlyPlaying)}
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

      <Modal
        visible={showWordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWordModal(false)}
      >
        <View style={styles.meaningModal}>
          <View style={styles.meaningContent}>
            <Text style={styles.selectedWord}>{selectedWord}</Text>
            
            {isLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : wordMeaning ? (
              <View style={styles.meaningContainer}>
                <Text style={styles.japaneseTranslation}>
                  {wordMeaning.japaneseTranslation}
                </Text>
              </View>
            ) : (
              <Text style={styles.noMeaning}>意味が見つかりませんでした</Text>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveWord}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setShowWordModal(false)}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tappableWord: {
    fontSize: 16,
    color: '#2196F3',
    textDecorationLine: 'underline',
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
  meaningModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  meaningContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  selectedWord: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  meaning: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  meaningContainer: {
    width: '100%',
    marginVertical: 15,
  },
  partOfSpeech: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  definition: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  example: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noMeaning: {
    fontSize: 16,
    color: '#666',
    marginVertical: 15,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  japaneseTranslation: {
    fontSize: 20,
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  disabledWord: {
    color: '#999',
    textDecorationLine: 'none',
  },
});

export default SubtitleDisplay;