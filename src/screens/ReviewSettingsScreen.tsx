import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReviewInterval, UserSettings } from '../types/progress';
import DateTimePicker from '@react-native-community/datetimepicker';

const DEFAULT_SETTINGS: UserSettings = {
  reviewIntervals: {
    initial: 24, // 24時間
    good: 72,    // 3日
    again: 12,   // 12時間
  },
  dailyGoal: 10,
  reminderEnabled: false,
  reminderTime: '09:00',
};

export const ReviewSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  };

  const handleIntervalChange = (key: keyof ReviewInterval, value: string) => {
    const numValue = parseInt(value) || 0;
    saveSettings({
      ...settings,
      reviewIntervals: {
        ...settings.reviewIntervals,
        [key]: numValue,
      },
    });
  };

  const handleDailyGoalChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    saveSettings({
      ...settings,
      dailyGoal: numValue,
    });
  };

  const handleReminderToggle = () => {
    saveSettings({
      ...settings,
      reminderEnabled: !settings.reminderEnabled,
    });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const timeString = selectedDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
      saveSettings({
        ...settings,
        reminderTime: timeString,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>復習間隔の設定</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>初回復習までの時間（時間）</Text>
          <TextInput
            style={styles.input}
            value={settings.reviewIntervals.initial.toString()}
            onChangeText={(value) => handleIntervalChange('initial', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>正解時の次回復習までの時間（時間）</Text>
          <TextInput
            style={styles.input}
            value={settings.reviewIntervals.good.toString()}
            onChangeText={(value) => handleIntervalChange('good', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>不正解時の次回復習までの時間（時間）</Text>
          <TextInput
            style={styles.input}
            value={settings.reviewIntervals.again.toString()}
            onChangeText={(value) => handleIntervalChange('again', value)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>目標設定</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>1日の目標単語数</Text>
          <TextInput
            style={styles.input}
            value={settings.dailyGoal.toString()}
            onChangeText={handleDailyGoalChange}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>リマインダー</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.label}>復習リマインダー</Text>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={handleReminderToggle}
          />
        </View>

        {settings.reminderEnabled && (
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeButtonText}>
              リマインド時刻: {settings.reminderTime}
            </Text>
          </TouchableOpacity>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={new Date(`2000-01-01T${settings.reminderTime}`)}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}
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
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 