import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVocabularyItems, deleteVocabularyItem, updateVocabularyItemImage } from '../utils/vocabulary';
import { VocabularyItem, VideoInfo } from '../types/vocabulary';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList, VideoStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VocabularyListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, '単語帳'>,
  NativeStackNavigationProp<VideoStackParamList>
>;

const SAVED_VIDEOS_KEY = 'saved_videos';

interface SavedVideo {
  title: string;
  url: string;
  thumbnail: string;
}

const VocabularyListScreen: React.FC = () => {
  const navigation = useNavigation<VocabularyListScreenNavigationProp>();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [editingWord, setEditingWord] = useState<VocabularyItem | null>(null);
  const [editedTranslation, setEditedTranslation] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_VIDEOS_KEY);
      if (saved) {
        setSavedVideos(JSON.parse(saved));
      }
    } catch (error) {
      console.error('保存された動画の読み込みに失敗しました:', error);
    }
  };

  const getVideoTitle = (videoId: string) => {
    const video = savedVideos.find(v => v.url.includes(videoId));
    return video ? video.title : `Video ${videoId}`;
  };

  const loadItems = async () => {
    try {
      const savedItems = await getVocabularyItems();
      // 既存のデータに復習情報がない場合は追加
      const updatedItems = savedItems.map(item => {
        if (!item.reviewInfo) {
          return {
            ...item,
            reviewInfo: {
              lastReviewDate: 0,
              nextReviewDate: Date.now(),
              reviewCount: 0,
              correctCount: 0,
              level: 0,
            }
          };
        }
        return item;
      });

      // 更新されたデータを保存
      if (savedItems.some(item => !item.reviewInfo)) {
        await AsyncStorage.setItem('vocabulary_items', JSON.stringify(updatedItems));
      }

      setItems(updatedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('エラー', '単語の読み込みに失敗しました');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const handleImageUpload = async (word: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('エラー', '画像へのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        await updateVocabularyItemImage(word, imageUri);
        await loadItems();
        Alert.alert('成功', '画像を保存しました');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('エラー', '画像のアップロードに失敗しました');
    }
  };

  const handleDelete = async (word: string) => {
    await deleteVocabularyItem(word);
    await loadItems();
  };

  const handleVideoPress = (videoInfo: VideoInfo) => {
    navigation.navigate('動画', {
      screen: 'VideoPlayer',
      params: {
        videoId: videoInfo.videoId,
        startTime: videoInfo.startTime,
        fromVocabulary: true
      }
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEditTranslation = async () => {
    if (!editingWord) return;

    try {
      const updatedItem = {
        ...editingWord,
        japaneseTranslation: editedTranslation,
      };

      const allItems = await getVocabularyItems();
      const updatedItems = allItems.map(item =>
        item.word === editingWord.word ? updatedItem : item
      );

      await AsyncStorage.setItem('vocabulary_items', JSON.stringify(updatedItems));
      await loadItems();
      setShowEditModal(false);
      setEditingWord(null);
      Alert.alert('成功', '日本語訳を更新しました');
    } catch (error) {
      console.error('Error updating translation:', error);
      Alert.alert('エラー', '日本語訳の更新に失敗しました');
    }
  };

  const renderItem = ({ item }: { item: VocabularyItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <View style={styles.mainSection}>
          <View style={styles.textSection}>
            <View style={styles.wordHeader}>
              <Text style={styles.wordText}>{item.word}</Text>
              <View style={styles.meaningContainer}>
                <Text style={styles.meaningText}>{item.japaneseTranslation}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingWord(item);
                    setEditedTranslation(item.japaneseTranslation);
                    setShowEditModal(true);
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>
            {item.videoInfo && (
              <View style={styles.exampleContainer}>
                {highlightWord(item.videoInfo.subtitle, item.word)}
                <Text style={styles.videoTitleText}>{getVideoTitle(item.videoInfo.videoId)}</Text>
              </View>
            )}
            <View style={styles.reviewInfoContainer}>
              <View style={styles.reviewInfoRow}>
                <View style={styles.reviewInfoItem}>
                  <Ionicons name="repeat" size={16} color="#666" />
                  <Text style={styles.reviewInfoText}>
                    復習回数: {item.reviewInfo?.reviewCount || 0}回
                  </Text>
                </View>
                <View style={styles.reviewInfoItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#666" />
                  <Text style={styles.reviewInfoText}>
                    正解率: {item.reviewInfo ? Math.round((item.reviewInfo.correctCount / item.reviewInfo.reviewCount) * 100) || 0 : 0}%
                  </Text>
                </View>
              </View>
              <View style={styles.reviewInfoRow}>
                <View style={styles.reviewInfoItem}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.reviewInfoText}>
                    前回: {item.reviewInfo?.lastReviewDate === 0 ? '-' : (item.reviewInfo?.lastReviewDate ? formatDate(item.reviewInfo.lastReviewDate) : '未復習')}
                  </Text>
                </View>
                <View style={styles.reviewInfoItem}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.reviewInfoText}>
                    次回: {item.reviewInfo ? formatDate(item.reviewInfo.nextReviewDate) : formatDate(Date.now())}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.imageSection}>
              {item.userImage ? (
                <View>
                  <Image source={{ uri: item.userImage }} style={styles.userImage} />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={() => handleImageUpload(item.word)}
                  >
                    <Ionicons name="camera" size={16} color="white" />
                    <Text style={styles.changeImageText}>画像を変更</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => handleImageUpload(item.word)}
                >
                  <Ionicons name="camera-outline" size={24} color="#4A90E2" />
                  <Text style={styles.addImageText}>イメージを追加</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => 
                Alert.alert(
                  '単語の削除',
                  `"${item.word}"を削除してもよろしいですか？`,
                  [
                    {
                      text: 'キャンセル',
                      style: 'cancel',
                    },
                    {
                      text: '削除',
                      style: 'destructive',
                      onPress: () => handleDelete(item.word),
                    },
                  ]
                )
              }
            >
              <Ionicons name="trash-outline" size={24} color="#ff5252" />
            </TouchableOpacity>

            {item.videoInfo && (
              <TouchableOpacity
                style={styles.videoThumbnail}
                onPress={() => handleVideoPress(item.videoInfo)}
              >
                <Image
                  source={{ uri: item.videoInfo.thumbnailUrl }}
                  style={styles.thumbnail}
                />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={20} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const highlightWord = (subtitle: string, word: string) => {
    const parts = subtitle.split(new RegExp(`(${word})`, 'gi'));
    return (
      <Text style={styles.subtitleText}>
        {parts.map((part, i) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <Text key={i} style={styles.highlightedWord}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>単語一覧</Text>
        <TouchableOpacity 
          style={styles.reviewButton}
          onPress={() => {
            const now = Date.now();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const todayStart = today.getTime();
            const todayEnd = todayStart + 24 * 60 * 60 * 1000;

            // 復習対象の単語を抽出
            const reviewDueItems = items.filter(item => {
              // 新規単語（まだ一度も復習していない）
              const isNew = item.reviewInfo.lastReviewDate === 0;
              // 次回の復習日が過ぎている単語
              const isOverdue = item.reviewInfo.nextReviewDate < todayStart;
              // 今日が復習日の単語
              const isDueToday = item.reviewInfo.nextReviewDate >= todayStart && 
                                item.reviewInfo.nextReviewDate < todayEnd;

              return isNew || isOverdue || isDueToday;
            });

            if (reviewDueItems.length === 0) {
              Alert.alert('お知らせ', '現在復習が必要な単語はありません');
              return;
            }

            navigation.navigate('動画', {
              screen: 'Review',
              params: {
                items: reviewDueItems
              }
            });
          }}
        >
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.reviewButtonText}>復習開始</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.word}-${item.videoInfo.startTime}`}
        style={styles.list}
      />

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>日本語訳を編集</Text>
            <Text style={styles.wordLabel}>{editingWord?.word}</Text>
            <TextInput
              style={styles.translationInput}
              value={editedTranslation}
              onChangeText={setEditedTranslation}
              placeholder="日本語訳を入力"
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditTranslation}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reviewButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemContent: {
    flex: 1,
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textSection: {
    flex: 2,
    marginRight: 10,
  },
  wordHeader: {
    marginBottom: 8,
  },
  rightSection: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  imageSection: {
    width: '100%',
    marginBottom: 10,
  },
  userImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  addImageText: {
    color: '#4A90E2',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  changeImageButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  videoThumbnail: {
    width: 100,
    height: 75,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
  },
  deleteButton: {
    padding: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 5,
  },
  highlightedWord: {
    backgroundColor: '#ffeb3b',
    fontWeight: 'bold',
  },
  wordText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meaningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meaningText: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 8,
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  exampleContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    flex: 1,
  },
  videoTitleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  reviewInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  reviewInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  wordLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  translationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default VocabularyListScreen; 