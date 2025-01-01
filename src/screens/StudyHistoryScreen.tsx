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

interface StudyRecord {
  date: string;
  newWords: number;
  reviewedWords: number;
  correctRate: number;
  studyTime: number; // 分単位
}

interface StudyStats {
  totalWords: number;
  totalReviews: number;
  averageCorrectRate: number;
  studyStreak: number;
  totalStudyTime: number; // 分単位
  averageStudyTime: number; // 分単位/日
}

const StudyHistoryScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [stats, setStats] = useState<StudyStats>({
    totalWords: 0,
    totalReviews: 0,
    averageCorrectRate: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    averageStudyTime: 0,
  });

  useEffect(() => {
    loadStudyHistory();
  }, [selectedPeriod]);

  const loadStudyHistory = async () => {
    try {
      // 単語データの取得
      const vocabularyItems = await AsyncStorage.getItem('vocabulary_items');
      const studyTimeData = await AsyncStorage.getItem('study_time_records') || '{}';
      if (!vocabularyItems) return;

      const items = JSON.parse(vocabularyItems);
      const timeRecords = JSON.parse(studyTimeData);
      const now = new Date();
      const records: StudyRecord[] = [];

      // 期間に応じてデータをフィルタリング
      const periodDays = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // 日付ごとの学習記録を集計
      items.forEach((item: any) => {
        const itemDate = new Date(item.timestamp);
        if (itemDate >= startDate) {
          const dateStr = itemDate.toISOString().split('T')[0];
          const existingRecord = records.find(r => r.date === dateStr);
          const dailyStudyTime = timeRecords[dateStr] || 0;
          
          if (existingRecord) {
            existingRecord.newWords++;
            if (item.reviewInfo.reviewCount > 0) {
              existingRecord.reviewedWords += item.reviewInfo.reviewCount;
              existingRecord.correctRate = (existingRecord.correctRate + 
                (item.reviewInfo.correctCount / item.reviewInfo.reviewCount)) / 2;
            }
            existingRecord.studyTime = dailyStudyTime;
          } else {
            records.push({
              date: dateStr,
              newWords: 1,
              reviewedWords: item.reviewInfo.reviewCount,
              correctRate: item.reviewInfo.reviewCount > 0 
                ? item.reviewInfo.correctCount / item.reviewInfo.reviewCount * 100
                : 0,
              studyTime: dailyStudyTime,
            });
          }
        }
      });

      // 統計情報の計算
      const totalWords = items.length;
      const totalReviews = items.reduce((sum: number, item: any) => 
        sum + item.reviewInfo.reviewCount, 0);
      const averageCorrectRate = items.reduce((sum: number, item: any) => 
        sum + (item.reviewInfo.reviewCount > 0 
          ? item.reviewInfo.correctCount / item.reviewInfo.reviewCount
          : 0), 0) / items.length * 100;
      
      // 学習時間の統計
      const totalStudyTime = records.reduce((sum, record) => sum + record.studyTime, 0);
      const averageStudyTime = totalStudyTime / records.length;

      // 学習継続日数の計算
      let streak = 0;
      const dates = new Set(records.map(r => r.date));
      for (let i = 0; i < periodDays; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        if (dates.has(date)) {
          streak++;
        } else {
          break;
        }
      }

      setStudyRecords(records.sort((a, b) => a.date.localeCompare(b.date)));
      setStats({
        totalWords,
        totalReviews,
        averageCorrectRate,
        studyStreak: streak,
        totalStudyTime,
        averageStudyTime,
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
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive,
              ]}>週間</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive,
              ]}>月間</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'all' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('all')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'all' && styles.periodButtonTextActive,
              ]}>全期間</Text>
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
            <Ionicons name="refresh" size={24} color="#FF9F40" />
            <Text style={styles.statsValue}>{stats.totalReviews}</Text>
            <Text style={styles.statsLabel}>総復習回数</Text>
          </View>
          <View style={styles.statsItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.statsValue}>{Math.round(stats.averageCorrectRate)}%</Text>
            <Text style={styles.statsLabel}>平均正解率</Text>
          </View>
          <View style={styles.statsItem}>
            <Ionicons name="flame" size={24} color="#FF5252" />
            <Text style={styles.statsValue}>{stats.studyStreak}</Text>
            <Text style={styles.statsLabel}>継続日数</Text>
          </View>
          <View style={styles.statsItem}>
            <Ionicons name="time" size={24} color="#2196F3" />
            <Text style={styles.statsValue}>{formatStudyTime(stats.totalStudyTime)}</Text>
            <Text style={styles.statsLabel}>総学習時間</Text>
          </View>
          <View style={styles.statsItem}>
            <Ionicons name="hourglass" size={24} color="#9C27B0" />
            <Text style={styles.statsValue}>{formatStudyTime(stats.averageStudyTime)}</Text>
            <Text style={styles.statsLabel}>平均学習時間/日</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {renderChart()}
        </View>
      </View>
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