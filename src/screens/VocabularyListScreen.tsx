import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVocabularyItems, deleteVocabularyItem, updateVocabularyItemImage } from '../utils/vocabulary';
import { VocabularyItem } from '../types/vocabulary';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type VocabularyListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VocabularyListScreen: React.FC = () => {
  const navigation = useNavigation<VocabularyListScreenNavigationProp>();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewItems, setReviewItems] = useState<VocabularyItem[]>([]);

  const loadItems = async () => {
    const savedItems = await getVocabularyItems();
    setItems(savedItems);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const startReview = () => {
    const shuffledItems = [...items].sort(() => Math.random() - 0.5);
    setReviewItems(shuffledItems);
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setShowReview(true);
  };

  const handleJudgment = (isCorrect: boolean) => {
    if (currentReviewIndex < reviewItems.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
      setShowAnswer(false);
    } else {
      setShowReview(false);
    }
  };

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

  const handleVideoPress = (videoId: string, startTime: number) => {
    navigation.navigate('VideoPlayer', {
      videoId: videoId,
      subtitles: [],
      startTime: startTime
    });
  };

  const renderItem = ({ item }: { item: VocabularyItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <View style={styles.mainSection}>
          <View style={styles.textSection}>
            <View style={styles.wordHeader}>
              <Text style={styles.wordText}>{item.word}</Text>
              <Text style={styles.meaningText}>{item.japaneseTranslation}</Text>
            </View>
            {item.videoInfo && (
              <View style={styles.exampleContainer}>
                {highlightWord(item.videoInfo.subtitle, item.word)}
              </View>
            )}
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
              onPress={() => handleDelete(item.word)}
            >
              <Ionicons name="trash-outline" size={24} color="#ff5252" />
            </TouchableOpacity>

            {item.videoInfo && (
              <TouchableOpacity
                style={styles.videoThumbnail}
                onPress={() => handleVideoPress(item.videoInfo.videoId, item.videoInfo.startTime || 0)}
              >
                <Image
                  source={{ uri: item.videoInfo.thumbnailUrl }}
                  style={styles.thumbnail}
                />
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>▶</Text>
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
        <TouchableOpacity style={styles.reviewButton} onPress={startReview}>
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.reviewButtonText}>復習開始</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.word}
        style={styles.list}
      />

      <Modal visible={showReview} animationType="slide">
        <SafeAreaView style={styles.reviewContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowReview(false)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {reviewItems.length > 0 && (
            <ScrollView style={styles.reviewContent}>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {currentReviewIndex + 1} / {reviewItems.length}
                </Text>
              </View>

              <View style={styles.cardContainer}>
                <Text style={styles.exampleText}>
                  {highlightWord(
                    reviewItems[currentReviewIndex].videoInfo.subtitle,
                    reviewItems[currentReviewIndex].word
                  )}
                </Text>

                {showAnswer ? (
                  <View style={styles.answerContainer}>
                    <Text style={styles.reviewWordText}>
                      {reviewItems[currentReviewIndex].word}
                    </Text>
                    <Text style={styles.reviewMeaningText}>
                      {reviewItems[currentReviewIndex].japaneseTranslation}
                    </Text>
                    {reviewItems[currentReviewIndex].userImage && (
                      <Image
                        source={{ uri: reviewItems[currentReviewIndex].userImage }}
                        style={styles.reviewImage}
                      />
                    )}
                    <View style={styles.judgmentContainer}>
                      <TouchableOpacity
                        style={[styles.judgmentButton, styles.incorrectButton]}
                        onPress={() => handleJudgment(false)}
                      >
                        <Text style={styles.judgmentButtonText}>❌</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.judgmentButton, styles.correctButton]}
                        onPress={() => handleJudgment(true)}
                      >
                        <Text style={styles.judgmentButtonText}>⭕️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.showButton}
                    onPress={() => setShowAnswer(true)}
                  >
                    <Text style={styles.showButtonText}>答えを確認</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
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
  reviewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 15,
    zIndex: 1,
  },
  reviewContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
  },
  cardContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  exampleText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  answerContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewWordText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reviewMeaningText: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 10,
  },
  reviewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  judgmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  judgmentButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    margin: 10,
  },
  incorrectButton: {
    backgroundColor: '#ff5252',
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  judgmentButtonText: {
    fontSize: 40,
  },
  showButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  showButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  translatedExample: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  wordText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 8,
  },
  exampleContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    flex: 1,
  },
});

export default VocabularyListScreen; 