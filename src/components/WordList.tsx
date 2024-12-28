import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { VocabularyItem } from '../types/vocabulary';
import { getVocabularyItems, deleteVocabularyItem, updateVocabularyItemImage } from '../utils/vocabulary';
import * as ImagePicker from 'expo-image-picker';
import { Subtitle } from '../utils/subtitles';

type VocabularyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  onVideoPress: (videoId: string, timestamp: number) => void;
};

export const WordList: React.FC<Props> = ({ onVideoPress }) => {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<VocabularyNavigationProp>();

  const loadWords = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedWords = await getVocabularyItems();
      setWords(savedWords);
    } catch (error) {
      console.error('単語の読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        await loadWords();
        Alert.alert('成功', '画像を保存しました');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('エラー', '画像のアップロードに失敗しました');
    }
  };

  const handleDeleteWord = async (word: string) => {
    Alert.alert(
      '単語の削除',
      `"${word}"を削除しますか？`,
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
              await deleteVocabularyItem(word);
              await loadWords();
            } catch (error) {
              console.error('Error deleting word:', error);
              Alert.alert('エラー', '単語の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleVideoPress = (videoId: string) => {
    onVideoPress(videoId, 0);
  };

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords])
  );

  const renderHighlightedText = (text: string, word: string) => {
    const parts = text.split(new RegExp(`(${word})`, 'gi'));
    return (
      <Text style={styles.subtitle}>
        {parts.map((part, index) => 
          part.toLowerCase() === word.toLowerCase() ? (
            <Text key={index} style={styles.highlightedWord}>{part}</Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const renderItem = ({ item }: { item: VocabularyItem }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={styles.wordTranslationContainer}>
          <Text style={styles.word}>{item.word}</Text>
          <Text style={styles.japaneseTranslation}>{item.japaneseTranslation}</Text>
        </View>
        {item.videoInfo && (
          <View style={styles.subtitleContainer}>
            {renderHighlightedText(item.videoInfo.subtitle, item.word)}
            <Text style={styles.translatedExample}>{item.videoInfo.translatedSubtitle}</Text>
          </View>
        )}
      </View>

      {item.userImage ? (
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: item.userImage }} 
            style={styles.wordImage}
          />
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
          <Text style={styles.addImageText}>イメージ画像を追加</Text>
          <Text style={styles.addImageSubText}>単語のイメージを画像で記録</Text>
        </TouchableOpacity>
      )}

      {item.videoInfo && (
        <TouchableOpacity 
          style={styles.videoThumbnail}
          onPress={() => item.videoInfo && handleVideoPress(item.videoInfo.videoId)}
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

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteWord(item.word)}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <FlatList
      data={words}
      renderItem={renderItem}
      keyExtractor={item => item.word}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  wordHeader: {
    marginBottom: 16,
  },
  wordTranslationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitleContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  word: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  japaneseTranslation: {
    fontSize: 20,
    color: '#4CAF50',
    marginLeft: 16,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  wordImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
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
  addImageButton: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 4,
  },
  addImageSubText: {
    fontSize: 12,
    color: '#666',
  },
  exampleSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  exampleContent: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  highlightedWord: {
    backgroundColor: '#FFE082',
    color: '#000',
    fontWeight: '500',
  },
  translatedExample: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  videoThumbnail: {
    position: 'relative',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 4,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
  },
}); 