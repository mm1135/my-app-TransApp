import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  createdAt: string;
  lastReviewedAt?: string;
  correctCount: number;
  totalCount: number;
}

interface StudyRecord {
  date: string;
  newWords: number;
  reviewedWords: number;
  correctRate: number;
}

interface StudyStats {
  totalWords: number;
  streak: number;
  correctRate: number;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isDateInRange = (date: Date, period: 'week' | 'month' | 'all'): boolean => {
  const now = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= startDate;
};

const loadVocabularyItems = async (): Promise<VocabularyItem[]> => {
  const items = await AsyncStorage.getItem('vocabulary_items');
  return items ? JSON.parse(items) : [];
};

const calculateStreak = (records: StudyRecord[]): number => {
  if (records.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  const dates = new Set(records.map(r => r.date));
  
  for (let i = 0; i < 365; i++) {
    const date = formatDate(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
    if (dates.has(date)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const StudyHistoryScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [stats, setStats] = useState<StudyStats>({
    totalWords: 0,
    streak: 0,
    correctRate: 0,
  });

  useEffect(() => {
    loadStudyHistory();
  }, [selectedPeriod]);

  const loadStudyHistory = async () => {
    try {
      const vocabularyItems = await loadVocabularyItems();
      const filteredItems = vocabularyItems.filter(item => {
        const itemDate = new Date(item.lastReviewedAt || item.createdAt);
        return isDateInRange(itemDate, selectedPeriod);
      });

      const recordsByDate = new Map<string, StudyRecord>();

      filteredItems.forEach(item => {
        const date = new Date(item.lastReviewedAt || item.createdAt);
        const dateStr = formatDate(date);
        
        const record = recordsByDate.get(dateStr) || {
          date: dateStr,
          newWords: 0,
          reviewedWords: 0,
          correctRate: 0
        };

        if (item.lastReviewedAt) {
          record.reviewedWords += 1;
          if (item.correctCount > 0) {
            record.correctRate = (record.correctRate * (record.reviewedWords - 1) + (item.correctCount / item.totalCount)) / record.reviewedWords;
          }
        } else {
          record.newWords += 1;
        }

        recordsByDate.set(dateStr, record);
      });

      const sortedRecords = Array.from(recordsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
      setStudyRecords(sortedRecords);

      // 統計情報の計算
      const totalNewWords = sortedRecords.reduce((sum, record) => sum + record.newWords, 0);
      const totalReviewedWords = sortedRecords.reduce((sum, record) => sum + record.reviewedWords, 0);
      const averageCorrectRate = sortedRecords.length > 0
        ? sortedRecords.reduce((sum, record) => sum + record.correctRate, 0) / sortedRecords.length
        : 0;

      const currentStreak = calculateStreak(sortedRecords);

      setStats({
        totalWords: totalNewWords + totalReviewedWords,
        streak: currentStreak,
        correctRate: averageCorrectRate * 100
      });

    } catch (error) {
      console.error('Error loading study history:', error);
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}時間${mins}分`;
    }
    return `${mins}分`;
  };

  const renderChart = () => {
    if (!studyRecords.length) return null;

    const chartData = studyRecords.map(record => ({
      date: parseInt(record.date.split('-')[2], 10),
      count: record.newWords + record.reviewedWords
    }));

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>学習単語数の推移</Text>
        <View style={styles.chartWrapper}>
          <View style={styles.yAxisLabel}>
            <Text style={styles.axisText}>単語数（個）</Text>
          </View>
          <LineChart
            data={{
              labels: chartData.map(data => data.date.toString()),
              datasets: [{
                data: chartData.map(data => data.count)
              }]
            }}
            width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#007AFF'
              },
              propsForLabels: {
                fontSize: 10,
                rotation: 45
              },
              formatYLabel: (yLabel: string) => parseInt(yLabel).toString(),
              formatXLabel: (xLabel: string) => xLabel
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              paddingRight: 0,
              marginRight: -20
            }}
            bezier
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            yAxisInterval={1}
          />
        </View>
        <Text style={styles.xAxisLabel}>日付（日）</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>学習統計</Text>
          <View style={styles.periodButtons}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>週間</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>月間</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod('all')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'all' && styles.periodButtonTextActive]}>全期間</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <Ionicons name="book" size={24} color="#4CAF50" />
            <Text style={styles.statsValue}>{stats.totalWords}</Text>
            <Text style={styles.statsLabel}>総単語数</Text>
          </View>
          <View style={styles.statsItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statsValue}>{stats.correctRate.toFixed(1)}%</Text>
            <Text style={styles.statsLabel}>正解率</Text>
          </View>
          <View style={styles.statsItem}>
            <Ionicons name="flame" size={24} color="#FF5252" />
            <Text style={styles.statsValue}>{stats.streak}日</Text>
            <Text style={styles.statsLabel}>学習継続日数</Text>
          </View>
        </View>
      </View>

      {renderChart()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabel: {
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  xAxisLabel: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  axisText: {
    color: '#666',
    fontSize: 12,
    transform: [{ rotate: '-90deg' }],
  },
});

export default StudyHistoryScreen; 