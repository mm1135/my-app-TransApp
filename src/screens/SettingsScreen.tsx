import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';

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
  const { settings: globalSettings, updateSettings: updateGlobalSettings } = useSettings();
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

  const renderHowToUseSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>使い方</Text>
        <TouchableOpacity
          style={styles.howToUseButton}
          onPress={() => setShowHowToUse(!showHowToUse)}
        >
          <Text style={styles.howToUseButtonText}>
            {showHowToUse ? '閉じる' : '開く'}
          </Text>
          <Ionicons
            name={showHowToUse ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#4CAF50"
          />
        </TouchableOpacity>
      </View>

      {showHowToUse && (
        <View style={styles.howToUseContent}>
          <View style={styles.tabSection}>
            <View style={styles.tabHeader}>
              <Ionicons name="play-circle" size={24} color="#4CAF50" />
              <Text style={styles.tabTitle}>動画タブ</Text>
            </View>
            <Text style={styles.tabDescription}>
              1. YouTubeの動画URLを入力{'\n'}
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
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderHowToUseSection()}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>動画設定</Text>
          <Ionicons name="videocam" size={24} color="#4CAF50" />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>日本語訳を表示</Text>
            <Switch
              value={globalSettings.showJapaneseTranslation}
              onValueChange={(value) =>
                updateGlobalSettings({ showJapaneseTranslation: value })
              }
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={globalSettings.showJapaneseTranslation ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            動画再生時の日本語訳の表示を切り替えます
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>復習モード設定</Text>
          <Ionicons name="school" size={24} color="#4CAF50" />
        </View>
        
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
              <Ionicons
                name="text"
                size={20}
                color={settings.reviewMode === 'word' ? 'white' : '#666'}
              />
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
              <Ionicons
                name="document-text"
                size={20}
                color={settings.reviewMode === 'sentence' ? 'white' : '#666'}
              />
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
              <Ionicons
                name="albums"
                size={20}
                color={settings.reviewMode === 'both' ? 'white' : '#666'}
              />
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <Ionicons name="warning" size={24} color="#ff3b30" />
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  howToUseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  howToUseButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  howToUseContent: {
    marginTop: 16,
  },
  tabSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  tabDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default SettingsScreen; 