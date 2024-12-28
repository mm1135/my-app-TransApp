import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

type Settings = {
  showJapaneseTranslation: boolean;
  autoPlayVideo: boolean;
  reviewInterval: number;
  notificationsEnabled: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  showJapaneseTranslation: true,
  autoPlayVideo: true,
  reviewInterval: 24,
  notificationsEnabled: true,
};

const SETTINGS_KEY = 'app_settings';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const handleToggleSetting = (key: keyof Settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    saveSettings(newSettings);
  };

  const handleReviewIntervalChange = () => {
    const intervals = [24, 48, 72, 168];
    const currentIndex = intervals.indexOf(settings.reviewInterval);
    const nextIndex = (currentIndex + 1) % intervals.length;
    const newSettings = {
      ...settings,
      reviewInterval: intervals[nextIndex],
    };
    saveSettings(newSettings);
  };

  const clearAllData = async () => {
    Alert.alert(
      'データを削除',
      'すべての保存データを削除しますか？\nこの操作は取り消せません。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('完了', 'すべてのデータを削除しました');
              loadSettings();
            } catch (error) {
              console.error('データの削除に失敗しました:', error);
              Alert.alert('エラー', 'データの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>一般設定</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>日本語訳を表示</Text>
          <Switch
            value={settings.showJapaneseTranslation}
            onValueChange={() => handleToggleSetting('showJapaneseTranslation')}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>動画の自動再生</Text>
          <Switch
            value={settings.autoPlayVideo}
            onValueChange={() => handleToggleSetting('autoPlayVideo')}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>通知</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={() => handleToggleSetting('notificationsEnabled')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>復習設定</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleReviewIntervalChange}
        >
          <Text style={styles.settingLabel}>復習間隔</Text>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>
              {settings.reviewInterval}時間
            </Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Text style={styles.dangerButtonText}>すべてのデータを削除</Text>
        </TouchableOpacity>
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
    marginVertical: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 15,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  dangerButton: {
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#ff3b30',
    fontSize: 16,
  },
});

export default SettingsScreen; 