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
import { Ionicons } from '@expo/vector-icons';

export interface ReviewSettings {
  reviewMode: 'word' | 'sentence' | 'both';
  randomizeOrder: boolean;
  showProgress: boolean;
  showStats: boolean;
}

const defaultSettings: ReviewSettings = {
  reviewMode: 'sentence',
  randomizeOrder: true,
  showProgress: true,
  showStats: true,
};

const SETTINGS_KEY = 'review_settings';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<ReviewSettings>(defaultSettings);

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

  const saveSettings = async (newSettings: ReviewSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'データを削除',
      'すべての単語データと設定を削除しますか？\nこの操作は取り消せません。',
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
              // デフォルト設定を再適用
              const defaultSettings: ReviewSettings = {
                reviewMode: 'sentence',
                randomizeOrder: true,
                showProgress: true,
                showStats: true,
              };
              await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
              setSettings(defaultSettings);
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
        <Text style={styles.sectionTitle}>復習モード設定</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>復習モード</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                settings.reviewMode === 'word' && styles.modeButtonActive,
              ]}
              onPress={() => saveSettings({ ...settings, reviewMode: 'word' })}
            >
              <Text style={[
                styles.modeButtonText,
                settings.reviewMode === 'word' && styles.modeButtonTextActive,
              ]}>単語のみ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                settings.reviewMode === 'sentence' && styles.modeButtonActive,
              ]}
              onPress={() => saveSettings({ ...settings, reviewMode: 'sentence' })}
            >
              <Text style={[
                styles.modeButtonText,
                settings.reviewMode === 'sentence' && styles.modeButtonTextActive,
              ]}>例文のみ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                settings.reviewMode === 'both' && styles.modeButtonActive,
              ]}
              onPress={() => saveSettings({ ...settings, reviewMode: 'both' })}
            >
              <Text style={[
                styles.modeButtonText,
                settings.reviewMode === 'both' && styles.modeButtonTextActive,
              ]}>両方</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>ランダム順序</Text>
            <Switch
              value={settings.randomizeOrder}
              onValueChange={(value) =>
                saveSettings({ ...settings, randomizeOrder: value })
              }
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.randomizeOrder ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            復習する単語の順序をランダムにします
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>進捗表示</Text>
            <Switch
              value={settings.showProgress}
              onValueChange={(value) =>
                saveSettings({ ...settings, showProgress: value })
              }
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.showProgress ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            復習中の進捗バーを表示します
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>統計情報表示</Text>
            <Switch
              value={settings.showStats}
              onValueChange={(value) =>
                saveSettings({ ...settings, showStats: value })
              }
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.showStats ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            復習中に正解率などの統計を表示します
          </Text>
        </View>
      </View>

      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={clearAllData}
        >
          <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          <Text style={styles.resetButtonText}>すべてのデータを削除</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  dangerSection: {
    marginTop: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SettingsScreen; 