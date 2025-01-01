import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../contexts/SettingsContext';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

interface InstructionSectionProps {
  title: string;
  description: string;
  image?: ImageSourcePropType;
}

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [showInstructions, setShowInstructions] = useState(false);

  const clearAllData = async () => {
    Alert.alert(
      'データの削除',
      'すべてのデータを削除してもよろしいですか？\nこの操作は取り消せません。',
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
              Alert.alert('完了', 'すべてのデータを削除しました。');
            } catch (error) {
              Alert.alert('エラー', 'データの削除に失敗しました。');
            }
          },
        },
      ]
    );
  };

  const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const InstructionSection: React.FC<InstructionSectionProps> = ({ title, description, image }) => (
    <View style={styles.instructionSection}>
      <Text style={styles.instructionTitle}>{title}</Text>
      <Text style={styles.instructionText}>{description}</Text>
      {image && (
        <Image source={image} style={styles.instructionImage} resizeMode="contain" />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <SettingSection title="動画設定">
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>日本語訳を表示</Text>
          <Switch
            value={settings.showJapaneseTranslation}
            onValueChange={(value) =>
              updateSettings({ showJapaneseTranslation: value })
            }
          />
        </View>
      </SettingSection>

      <SettingSection title="復習設定">
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>復習モード</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                settings.reviewMode === 'word' && styles.segmentButtonActive,
              ]}
              onPress={() => updateSettings({ reviewMode: 'word' })}
            >
              <Text style={[
                styles.segmentButtonText,
                settings.reviewMode === 'word' && styles.segmentButtonTextActive,
              ]}>単語</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                settings.reviewMode === 'sentence' && styles.segmentButtonActive,
              ]}
              onPress={() => updateSettings({ reviewMode: 'sentence' })}
            >
              <Text style={[
                styles.segmentButtonText,
                settings.reviewMode === 'sentence' && styles.segmentButtonTextActive,
              ]}>例文</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                settings.reviewMode === 'both' && styles.segmentButtonActive,
              ]}
              onPress={() => updateSettings({ reviewMode: 'both' })}
            >
              <Text style={[
                styles.segmentButtonText,
                settings.reviewMode === 'both' && styles.segmentButtonTextActive,
              ]}>両方</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>ランダム順序</Text>
          <Switch
            value={settings.randomizeOrder}
            onValueChange={(value) => updateSettings({ randomizeOrder: value })}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>進捗を表示</Text>
          <Switch
            value={settings.showProgress}
            onValueChange={(value) => updateSettings({ showProgress: value })}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>統計を表示</Text>
          <Switch
            value={settings.showStats}
            onValueChange={(value) => updateSettings({ showStats: value })}
          />
        </View>
      </SettingSection>

      <SettingSection title="使い方">
        <TouchableOpacity
          style={styles.instructionsToggle}
          onPress={() => setShowInstructions(!showInstructions)}
        >
          <Text style={styles.instructionsToggleText}>
            使い方を{showInstructions ? '非表示' : '表示'}
          </Text>
          <Ionicons
            name={showInstructions ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>

        {showInstructions && (
          <View style={styles.instructions}>
            <View style={styles.instructionSection}>
              <Text style={styles.instructionMainTitle}>基本的な使い方</Text>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionHeader}>
                  <Text style={styles.instructionNumber}>1</Text>
                  <Text style={styles.instructionTitle}>動画タブの使い方</Text>
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionSubtitle}>① 動画の追加</Text>
                  <Text style={styles.instructionText}>YouTubeの動画URLを入力して動画を追加します。</Text>
                  
                  <Text style={styles.instructionSubtitle}>② 字幕の操作</Text>
                  <Text style={styles.instructionText}>動画再生中に字幕をタップすると、単語を登録できます。</Text>
                  
                  <Text style={styles.instructionSubtitle}>③ 日本語訳の設定</Text>
                  <Text style={styles.instructionText}>設定から日本語訳の表示/非表示を切り替えられます。</Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionHeader}>
                  <Text style={styles.instructionNumber}>2</Text>
                  <Text style={styles.instructionTitle}>単語帳タブの使い方</Text>
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionSubtitle}>① 単語の管理</Text>
                  <Text style={styles.instructionText}>登録した単語の一覧を確認、編集、削除できます。</Text>
                  
                  <Text style={styles.instructionSubtitle}>② 復習モード</Text>
                  <Text style={styles.instructionText}>「復習開始」ボタンで復習を開始できます。単語のみ、例文のみ、または両方から選択可能です。</Text>
                  
                  <Text style={styles.instructionSubtitle}>③ 復習設定</Text>
                  <Text style={styles.instructionText}>ランダム順での出題や、進捗表示の有無を設定できます。</Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionHeader}>
                  <Text style={styles.instructionNumber}>3</Text>
                  <Text style={styles.instructionTitle}>履歴タブの使い方</Text>
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionSubtitle}>① 学習グラフ</Text>
                  <Text style={styles.instructionText}>縦軸：学習単語数（個）{'\n'}横軸：日付（日）{'\n'}グラフで日々の学習量の推移を確認できます。</Text>
                  
                  <Text style={styles.instructionSubtitle}>② 学習統計</Text>
                  <Text style={styles.instructionText}>日別、週別、月別の学習統計を確認できます。</Text>
                  
                  <Text style={styles.instructionSubtitle}>③ 継続記録</Text>
                  <Text style={styles.instructionText}>連続学習日数と総学習時間で、学習の継続状況を確認できます。</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </SettingSection>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={clearAllData}
      >
        <Text style={styles.deleteButtonText}>すべてのデータを削除</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionContent: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#007AFF',
  },
  segmentButtonText: {
    fontSize: 14,
    color: '#666',
  },
  segmentButtonTextActive: {
    color: '#fff',
  },
  instructionsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  instructionsToggleText: {
    fontSize: 16,
    color: '#007AFF',
  },
  instructions: {
    marginTop: 16,
  },
  instructionSection: {
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionImage: {
    width: '100%',
    height: 200,
    marginTop: 12,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    marginVertical: 24,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionMainTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  instructionItem: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 12,
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    backgroundColor: '#e8f2ff',
    borderRadius: 14,
  },
  instructionContent: {
    marginLeft: 40,
  },
  instructionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  }
});

export default SettingsScreen; 