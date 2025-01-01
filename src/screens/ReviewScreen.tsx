import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  useWindowDimensions,
  Image,
} from 'react-native';
import { getVocabularyItems } from '../utils/vocabulary';
import { VocabularyItem } from '../types/vocabulary';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { VideoStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ReviewSettings } from '../contexts/SettingsContext';
import { useFocusEffect } from '@react-navigation/native';
import { recordStudyTime } from '../utils/studyTime';

type ReviewScreenRouteProp = RouteProp<VideoStackParamList, 'Review'>;

type ReviewLevels = {
  LEVEL_0: number;
  LEVEL_1: number;
  LEVEL_2: number;
  LEVEL_3: number;
  LEVEL_4: number;
};

const REVIEW_INTERVALS: ReviewLevels = {
  LEVEL_0: 0,
  LEVEL_1: 24 * 60 * 60 * 1000,
  LEVEL_2: 3 * 24 * 60 * 60 * 1000,
  LEVEL_3: 7 * 24 * 60 * 60 * 1000,
  LEVEL_4: 30 * 24 * 60 * 60 * 1000,
};

const ReviewScreen: React.FC = () => {
  const route = useRoute<ReviewScreenRouteProp>();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [settings, setSettings] = useState<ReviewSettings>({
    reviewMode: 'word',
    randomizeOrder: true,
    showProgress: true,
    showStats: true,
    showJapaneseTranslation: true
  });
  const [currentMode, setCurrentMode] = useState<'word' | 'sentence' | 'both'>('word');
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    loadSettings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    if (route.params?.items) {
      const items = [...route.params.items];
      const shuffledItems = settings.randomizeOrder ? items.sort(() => Math.random() - 0.5) : items;
      setItems(shuffledItems);
      setCurrentIndex(0);
      setShowAnswer(false);
      setAnswers({});
    } else {
      loadItems();
    }
  }, [route.params?.items, settings]);

  useEffect(() => {
    return () => {
      const elapsedMinutes = Math.floor((Date.now() - startTime.current) / 60000);
      if (elapsedMinutes > 0) {
        recordStudyTime(elapsedMinutes);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('review_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setCurrentMode(parsedSettings.reviewMode);
      } else {
        const defaultSettings: ReviewSettings = {
          reviewMode: 'word',
          randomizeOrder: true,
          showProgress: true,
          showStats: true,
          showJapaneseTranslation: true
        };
        await AsyncStorage.setItem('review_settings', JSON.stringify(defaultSettings));
        setSettings(defaultSettings);
        setCurrentMode('sentence');
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
    }
  };

  const loadItems = async () => {
    try {
      const savedItems = await getVocabularyItems();
      const now = Date.now();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      const reviewDueItems = savedItems.filter(item => {
        const isNew = item.reviewInfo.lastReviewDate === 0;
        const isOverdue = item.reviewInfo.nextReviewDate < todayStart;
        const isDueToday = item.reviewInfo.nextReviewDate >= todayStart && 
                          item.reviewInfo.nextReviewDate < todayEnd;

        return isNew || isOverdue || isDueToday;
      });

      const sortedItems = reviewDueItems.sort((a, b) => {
        const aIsNew = a.reviewInfo.lastReviewDate === 0;
        const bIsNew = b.reviewInfo.lastReviewDate === 0;
        const aIsOverdue = a.reviewInfo.nextReviewDate < todayStart;
        const bIsOverdue = b.reviewInfo.nextReviewDate < todayStart;
        
        if (aIsOverdue && bIsOverdue) {
          return a.reviewInfo.nextReviewDate - b.reviewInfo.nextReviewDate;
        }
        if (aIsOverdue) return -1;
        if (bIsOverdue) return 1;
        if (aIsNew && bIsNew) {
          return b.timestamp - a.timestamp;
        }
        if (aIsNew) return 1;
        if (bIsNew) return -1;
        
        return a.reviewInfo.nextReviewDate - b.reviewInfo.nextReviewDate;
      });

      const limitedItems = sortedItems.slice(0, 10);
      const shuffledItems = settings.randomizeOrder ? [...limitedItems].sort(() => Math.random() - 0.5) : limitedItems;
      setItems(shuffledItems);
      setCurrentIndex(0);
      setShowAnswer(false);
      setAnswers({});

      if (shuffledItems.length === 0) {
        Alert.alert('お知らせ', '現在復習が必要な単語はありません');
      } else if (sortedItems.length > 10) {
        Alert.alert('お知らせ', `${sortedItems.length}個の復習対象のうち、10個を選択しました。\n残りは次回の復習で行えます。`);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('エラー', '単語の読み込みに失敗しました');
    }
  };

  const updateReviewInfo = async (item: VocabularyItem, isCorrect: boolean) => {
    const newLevel = isCorrect
      ? Math.min(item.reviewInfo.level + 1, 4)
      : Math.max(item.reviewInfo.level - 1, 0);

    const nextInterval = (() => {
      switch (newLevel) {
        case 0: return REVIEW_INTERVALS.LEVEL_0;
        case 1: return REVIEW_INTERVALS.LEVEL_1;
        case 2: return REVIEW_INTERVALS.LEVEL_2;
        case 3: return REVIEW_INTERVALS.LEVEL_3;
        case 4: return REVIEW_INTERVALS.LEVEL_4;
        default: return REVIEW_INTERVALS.LEVEL_1;
      }
    })();

    const now = Date.now();
    const updatedItem = {
      ...item,
      reviewInfo: {
        ...item.reviewInfo,
        lastReviewDate: now,
        nextReviewDate: now + nextInterval,
        reviewCount: item.reviewInfo.reviewCount + 1,
        correctCount: item.reviewInfo.correctCount + (isCorrect ? 1 : 0),
        level: newLevel,
      },
    };

    try {
      const allItems = await getVocabularyItems();
      const updatedItems = allItems.map(i =>
        i.word === item.word ? updatedItem : i
      );

      await AsyncStorage.setItem('vocabulary_items', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error updating review info:', error);
      Alert.alert('エラー', '復習情報の更新に失敗しました');
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    const currentItem = items[currentIndex];
    await updateReviewInfo(currentItem, isCorrect);
    const newAnswers = { ...answers, [currentIndex]: isCorrect };
    setAnswers(newAnswers);
    handleNext(newAnswers);
  };

  const handleNext = (currentAnswers = answers) => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      const answeredCount = items.length;
      const correctCount = Object.values(currentAnswers).filter(v => v).length;
      const correctRate = Math.round((correctCount / answeredCount) * 100);
      
      if (correctRate === 100) {
        Alert.alert(
          '復習完了',
          `正解率: ${correctRate}%\n正解数: ${correctCount}/${answeredCount}\n\n全問正解おめでとうございます！`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          '復習完了',
          `正解率: ${correctRate}%\n正解数: ${correctCount}/${answeredCount}\nもう一度復習しますか？`,
          [
            {
              text: 'はい',
              onPress: loadItems,
            },
            {
              text: 'いいえ',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    }
  };

  const renderQuestion = () => {
    const currentItem = items[currentIndex];
    if (currentMode === 'sentence') {
      return (
        <View style={styles.questionContainer}>
          <View style={styles.subtitleContainer}>
            {highlightWord(currentItem.videoInfo.subtitle, currentItem.word)}
          </View>
          {showAnswer && (
            <View style={styles.answerContainer}>
              <Text style={styles.meaningText}>
                {currentItem.japaneseTranslation}
              </Text>
              {currentItem.userImage && (
                <Image
                  source={{ uri: currentItem.userImage }}
                  style={styles.userImage}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        </View>
      );
    } else if (currentMode === 'word') {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.wordText}>{currentItem.word}</Text>
          {showAnswer && (
            <View style={styles.answerContainer}>
              <Text style={styles.meaningText}>
                {currentItem.japaneseTranslation}
              </Text>
              {currentItem.userImage && (
                <Image
                  source={{ uri: currentItem.userImage }}
                  style={styles.userImage}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.questionContainer}>
          <View style={styles.bothModeContainer}>
            <Text style={styles.wordText}>{currentItem.word}</Text>
            <View style={styles.subtitleContainer}>
              {highlightWord(currentItem.videoInfo.subtitle, currentItem.word)}
            </View>
          </View>
          {showAnswer && (
            <View style={styles.answerContainer}>
              <Text style={styles.meaningText}>
                {currentItem.japaneseTranslation}
              </Text>
              {currentItem.userImage && (
                <Image
                  source={{ uri: currentItem.userImage }}
                  style={styles.userImage}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        </View>
      );
    }
  };

  const highlightWord = (subtitle: string, word: string) => {
    const parts = subtitle.split(new RegExp(`(${word})`, 'gi'));
    return (
      <Text style={styles.subtitleText}>
        {parts.map((part, i) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <Text key={i} style={styles.highlightedWord}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noItemsText}>復習する項目がありません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {settings.showProgress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {items.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / items.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {renderQuestion()}
          {settings.showStats && showAnswer && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                復習回数: {items[currentIndex].reviewInfo.reviewCount}回
              </Text>
              <Text style={styles.statsText}>
                正解率: {Math.round((items[currentIndex].reviewInfo.correctCount / items[currentIndex].reviewInfo.reviewCount) * 100) || 0}%
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {!showAnswer ? (
          <TouchableOpacity
            style={styles.showAnswerButton}
            onPress={() => setShowAnswer(true)}
          >
            <Text style={styles.showAnswerButtonText}>答えを表示</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.judgmentButtons}>
            <TouchableOpacity
              style={[styles.judgmentButton, styles.incorrectButton]}
              onPress={() => handleAnswer(false)}
            >
              <Ionicons name="close" size={24} color="white" />
              <Text style={styles.judgmentButtonText}>不正解</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.judgmentButton, styles.correctButton]}
              onPress={() => handleAnswer(true)}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.judgmentButtonText}>正解</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={items.length === 0}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="information-circle-outline" size={48} color="#4CAF50" />
            <Text style={styles.modalTitle}>お知らせ</Text>
            <Text style={styles.modalText}>現在復習が必要な単語はありません</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.modalButtonText}>戻る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  answerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  meaningText: {
    fontSize: 24,
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  translationText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
  showAnswerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  showAnswerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  judgmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  judgmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  incorrectButton: {
    backgroundColor: '#ff5252',
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  judgmentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noItemsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  highlightedWord: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  bothModeContainer: {
    width: '100%',
  },
  userImage: {
    width: 150,
    height: 150,
    marginTop: 16,
    borderRadius: 8,
  },
});

export default ReviewScreen; 