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
  const [showHowToUse, setShowHowToUse] = useState(false);

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

  const renderHowToUseSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>アプリの使い方</Text>
      
      <TouchableOpacity
        style={styles.howToUseButton}
        onPress={() => setShowHowToUse(!showHowToUse)}
      >
        <Text style={styles.howToUseButtonText}>
          {showHowToUse ? '説明を閉じる' : '使い方を見る'}
        </Text>
        <Ionicons
          name={showHowToUse ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#4CAF50"
        />
      </TouchableOpacity>

      {showHowToUse && (
        <View style={styles.howToUseContent}>
          <View style={styles.tabSection}>
            <View style={styles.tabHeader}>
              <Ionicons name="play" size={24} color="#4CAF50" />
              <Text style={styles.tabTitle}>動画タブ</Text>
            </View>
            <Text style={styles.tabDescription}>
              1. YouTubeの動画URLを追加{'\n'}
              2. 動画を再生し、字幕から単語をタップ{'\n'}
              3. 日本語訳を確認して単語帳に保存{'\n'}
              4. 保存した単語には画像を追加可能
            </Text>
          </View>

          <View style={styles.tabSection}>
            <View style={styles.tabHeader}>
              <Ionicons name="book" size={24} color="#4CAF50" />
              <Text style={styles.tabTitle}>単語帳タブ</Text>
            </View>
            <Text style={styles.tabDescription}>
              1. 保存した単語の一覧を表示{'\n'}
              2. 単語ごとに例文、画像を確認{'\n'}
              3. 「復習開始」で復習モードを開始{'\n'}
              4. 単語の編集や削除が可能
            </Text>
          </View>

          <View style={styles.tabSection}>
            <View style={styles.tabHeader}>
              <Ionicons name="refresh" size={24} color="#4CAF50" />
              <Text style={styles.tabTitle}>復習について</Text>
            </View>
            <Text style={styles.tabDescription}>
              1. 新規単語と復習期限が来た単語を表示{'\n'}
              2. 単語・例文・両方から選んで復習{'\n'}
              3. 正解すると次の復習間隔が延長{'\n'}
              4. 不正解の場合は間隔が短くなります
            </Text>
          </View>

          <View style={styles.tipSection}>
            <Text style={styles.tipTitle}>Tips</Text>
            <Text style={styles.tipText}>
              ・単語には関連する画像を追加できます{'\n'}
              ・復習は1日10単語を目安に行います{'\n'}
              ・例文は実際の動画から学べます{'\n'}
              ・単語の意味は後から編集可能です
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderHowToUseSection()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>復習モード設定</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>復習モード</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => saveSettings({ ...settings, reviewMode: 'word' })}
            >
              <View style={styles.radio}>
                {settings.reviewMode === 'word' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>単語のみ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => saveSettings({ ...settings, reviewMode: 'sentence' })}
            >
              <View style={styles.radio}>
                {settings.reviewMode === 'sentence' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>例文のみ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => saveSettings({ ...settings, reviewMode: 'both' })}
            >
              <View style={styles.radio}>
                {settings.reviewMode === 'both' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>両方</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>ランダム順</Text>
          <Switch
            value={settings.randomizeOrder}
            onValueChange={(value) => saveSettings({ ...settings, randomizeOrder: value })}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>進捗表示</Text>
          <Switch
            value={settings.showProgress}
            onValueChange={(value) => saveSettings({ ...settings, showProgress: value })}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>統計表示</Text>
          <Switch
            value={settings.showStats}
            onValueChange={(value) => saveSettings({ ...settings, showStats: value })}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.clearDataButton}
        onPress={clearAllData}
      >
        <Text style={styles.clearDataButtonText}>すべてのデータを削除</Text>
      </TouchableOpacity>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  radioGroup: {
    marginTop: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  clearDataButton: {
    backgroundColor: '#ff5252',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  clearDataButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  howToUseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  howToUseButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  howToUseContent: {
    marginTop: 10,
  },
  tabSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  tabDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  tipSection: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1b5e20',
    lineHeight: 22,
  },
});

export default SettingsScreen; 