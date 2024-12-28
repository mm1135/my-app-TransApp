import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { WordLearningCard } from '../components/WordLearningCard';
import { getVocabularyItems } from '../utils/vocabulary';
import { VocabularyItem } from '../types/vocabulary';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createMaterialTopTabNavigator();

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const REVIEW_INTERVALS = {
  LEVEL_0: 0, // 初回学習
  LEVEL_1: DAY_IN_MS, // 1日後
  LEVEL_2: 3 * DAY_IN_MS, // 3日後
  LEVEL_3: 7 * DAY_IN_MS, // 7日後
  LEVEL_4: 30 * DAY_IN_MS, // 1ヶ月後
  COMPLETED: -1, // 学習完了
};

interface LearningHistory {
  [key: string]: {
    lastReviewed: number;
    nextReview: number;
    level: number;
    remembered: boolean;
    correctCount: number;
    totalCount: number;
  };
}

interface LearningStats {
  dailyWords: number;
  totalWords: number;
  levelCounts: Record<number, number>;
  overallAccuracy: number;
  lastUpdate: string;
}

const LEARNING_HISTORY_KEY = 'learning_history';
const LEARNING_STATS_KEY = 'learning_stats';

const WordLearningTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="NewWords"
        component={NewWordsScreen}
        options={{ title: '新規学習' }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{ title: '復習' }}
      />
      <Tab.Screen
        name="Completed"
        component={CompletedScreen}
        options={{ title: '完了' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: '統計' }}
      />
    </Tab.Navigator>
  );
};

const NewWordsScreen: React.FC = () => {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [learningHistory, setLearningHistory] = useState<LearningHistory>({});

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setIsLoading(true);
      const [savedWords, history] = await Promise.all([
        getVocabularyItems(),
        AsyncStorage.getItem(LEARNING_HISTORY_KEY),
      ]);

      const parsedHistory: LearningHistory = history ? JSON.parse(history) : {};
      setLearningHistory(parsedHistory);

      const newWords = savedWords.filter(word => !parsedHistory[word.word]);
      setWords(newWords);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('エラー', '単語の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResult = async (remembered: boolean) => {
    const currentWord = words[currentIndex];
    const newHistory = {
      ...learningHistory,
      [currentWord.word]: {
        lastReviewed: Date.now(),
        nextReview: Date.now() + REVIEW_INTERVALS.LEVEL_1,
        level: 0,
        remembered,
        correctCount: remembered ? 1 : 0,
        totalCount: 1,
      },
    };

    try {
      await AsyncStorage.setItem(LEARNING_HISTORY_KEY, JSON.stringify(newHistory));
      setLearningHistory(newHistory);
      await updateStats(remembered);
    } catch (error) {
      console.error('Error saving learning history:', error);
    }
  };

  const updateStats = async (remembered: boolean) => {
    try {
      const statsJson = await AsyncStorage.getItem(LEARNING_STATS_KEY);
      const stats: LearningStats = statsJson ? JSON.parse(statsJson) : {
        dailyWords: 0,
        totalWords: 0,
        levelCounts: {},
        overallAccuracy: 0,
        lastUpdate: '',
      };

      const today = new Date().toDateString();
      if (today !== stats.lastUpdate) {
        stats.dailyWords = 0;
      }

      stats.dailyWords++;
      stats.totalWords++;
      stats.overallAccuracy = (stats.overallAccuracy * (stats.totalWords - 1) + (remembered ? 1 : 0)) / stats.totalWords;
      stats.lastUpdate = today;

      await AsyncStorage.setItem(LEARNING_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert(
        '学習完了',
        '全ての新規単語を学習しました！',
        [
          {
            text: 'OK',
            onPress: () => loadWords(),
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWordsText}>
          新規学習する単語はありません
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {words.length}
        </Text>
      </View>
      <WordLearningCard
        word={words[currentIndex]}
        onResult={handleResult}
        onNext={handleNext}
      />
    </View>
  );
};

const ReviewScreen: React.FC = () => {
  // 復習画面の実装（同様の構造で、復習が必要な単語を表示）
  return null;
};

const CompletedScreen: React.FC = () => {
  // 完了した単語の一覧表示
  return null;
};

const StatsScreen: React.FC = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsJson = await AsyncStorage.getItem(LEARNING_STATS_KEY);
      if (statsJson) {
        setStats(JSON.parse(statsJson));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>学習統計</Text>
        <Text style={styles.statsText}>今日の学習: {stats.dailyWords}単語</Text>
        <Text style={styles.statsText}>総学習単語: {stats.totalWords}単語</Text>
        <Text style={styles.statsText}>
          正解率: {Math.round(stats.overallAccuracy * 100)}%
        </Text>
      </View>
    </View>
  );
};

export const WordLearningScreen: React.FC = () => {
  return <WordLearningTabs />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
  },
  noWordsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsText: {
    fontSize: 18,
    marginBottom: 10,
  },
}); 