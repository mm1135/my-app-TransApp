import AsyncStorage from '@react-native-async-storage/async-storage';

const STUDY_TIME_KEY = 'study_time_records';

export const recordStudyTime = async (minutes: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existingData = await AsyncStorage.getItem(STUDY_TIME_KEY);
    const timeRecords = existingData ? JSON.parse(existingData) : {};

    // 今日の学習時間を更新
    timeRecords[today] = (timeRecords[today] || 0) + minutes;

    await AsyncStorage.setItem(STUDY_TIME_KEY, JSON.stringify(timeRecords));
    return true;
  } catch (error) {
    console.error('学習時間の記録に失敗しました:', error);
    return false;
  }
};

export const getStudyTimeRecords = async () => {
  try {
    const data = await AsyncStorage.getItem(STUDY_TIME_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('学習時間の取得に失敗しました:', error);
    return {};
  }
}; 