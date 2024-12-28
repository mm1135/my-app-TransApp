import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { LearningProgress } from '../types/progress';

type Props = {
  progressData: LearningProgress[];
};

export const ProgressCharts: React.FC<Props> = ({ progressData }) => {
  const screenWidth = Dimensions.get('window').width;

  // 単語学習数の推移データ
  const learningData = {
    labels: progressData.slice(-7).map(p => p.date),
    datasets: [{
      data: progressData.slice(-7).map(p => p.wordsLearned)
    }]
  };

  // 正答率の円グラフデータ
  const totalCorrectRate = progressData.reduce((sum, p) => sum + p.correctAnswers, 0) /
    progressData.reduce((sum, p) => sum + p.totalAnswers, 0);
  
  const progressChartData = {
    data: [totalCorrectRate]
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>学習進捗</Text>
      
      <View style={styles.chartContainer}>
        <Text style={styles.subtitle}>単語学習数の推移</Text>
        <LineChart
          data={learningData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.subtitle}>総合正答率</Text>
        <ProgressChart
          data={progressChartData}
          width={screenWidth - 40}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          style={styles.chart}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  chartContainer: {
    marginBottom: 30,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 