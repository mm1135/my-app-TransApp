import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { getVocabularyItems } from '../utils/vocabulary';
import { VocabularyItem } from '../types/vocabulary';
import { useRoute, RouteProp } from '@react-navigation/native';
import { VideoStackParamList } from '../types/navigation';

type ReviewScreenRouteProp = RouteProp<VideoStackParamList, 'Review'>;

const ReviewScreen: React.FC = () => {
  const route = useRoute<ReviewScreenRouteProp>();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (route.params?.items) {
      const shuffledItems = [...route.params.items].sort(() => Math.random() - 0.5);
      setItems(shuffledItems);
      setCurrentIndex(0);
      setShowAnswer(false);
      setAnswers({});
    } else {
      loadItems();
    }
  }, [route.params?.items]);

  const loadItems = async () => {
    try {
      const savedItems = await getVocabularyItems();
      const shuffledItems = [...savedItems].sort(() => Math.random() - 0.5);
      setItems(shuffledItems);
      setCurrentIndex(0);
      setShowAnswer(false);
      setAnswers({});
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('エラー', '単語の読み込みに失敗しました');
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setAnswers({ ...answers, [currentIndex]: isCorrect });
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      const correctCount = Object.values(answers).filter(v => v).length;
      Alert.alert(
        '復習完了',
        `正解率: ${Math.round((correctCount / items.length) * 100)}%\nもう一度復習しますか？`,
        [
          {
            text: 'はい',
            onPress: loadItems,
          },
          {
            text: 'いいえ',
            style: 'cancel',
          },
        ]
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

  const currentItem = items[currentIndex];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {items.length}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          {highlightWord(currentItem.videoInfo.subtitle, currentItem.word)}
          
          {showAnswer ? (
            <>
              <View style={styles.answerContainer}>
                <Text style={styles.wordText}>{currentItem.word}</Text>
                <Text style={styles.meaningText}>
                  {currentItem.japaneseTranslation}
                </Text>
                {currentItem.userImage && (
                  <Image
                    source={{ uri: currentItem.userImage }}
                    style={styles.userImage}
                  />
                )}
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.answerButton, styles.incorrectButton]}
                  onPress={() => handleAnswer(false)}
                >
                  <Text style={styles.answerButtonText}>❌ 間違えた</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.answerButton, styles.correctButton]}
                  onPress={() => handleAnswer(true)}
                >
                  <Text style={styles.answerButtonText}>⭕️ 正解</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.showButton}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.showButtonText}>答えを確認</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subtitleText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    marginBottom: 20,
  },
  highlightedWord: {
    backgroundColor: '#ffeb3b',
    fontWeight: 'bold',
  },
  answerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  wordText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  meaningText: {
    fontSize: 20,
    color: '#4CAF50',
    marginBottom: 15,
  },
  userImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  incorrectButton: {
    backgroundColor: '#ff5252',
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  answerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  showButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  showButtonText: {
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
});

export default ReviewScreen; 