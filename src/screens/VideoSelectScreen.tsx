import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { parseYouTubeUrl, fetchVideoTitle } from '../utils/youtube';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

type VideoSelectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VideoSelect'>;

type SavedVideo = {
  title: string;
  url: string;
  thumbnail: string;
};

const SAVED_VIDEOS_KEY = 'saved_videos';

const VideoSelectScreen: React.FC = () => {
  const navigation = useNavigation<VideoSelectScreenNavigationProp>();
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAddVideo = async () => {
    const id = parseYouTubeUrl(newVideoUrl);
    if (!id) {
      Alert.alert('エラー', '有効なYouTube URLを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const title = await fetchVideoTitle(id);
      
      const newVideo = {
        title: title,
        url: newVideoUrl,
        thumbnail: `https://img.youtube.com/vi/${id}/default.jpg`,
      };

      const exists = savedVideos.some(v => v.url === newVideo.url);
      if (exists) {
        Alert.alert('エラー', 'この動画は既に追加されています');
        return;
      }

      const newVideos = [...savedVideos, newVideo];
      await AsyncStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(newVideos));
      setSavedVideos(newVideos);
      setNewVideoUrl('');
      setShowAddVideo(false);
    } catch (error) {
      console.error('動画の保存に失敗しました:', error);
      Alert.alert('エラー', '動画の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSelect = (url: string) => {
    const id = parseYouTubeUrl(url);
    if (id) {
      navigation.navigate('VideoLearning', { videoId: id });
    }
  };

  const handleDeleteVideo = async (url: string) => {
    try {
      const newVideos = savedVideos.filter(v => v.url !== url);
      await AsyncStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(newVideos));
      setSavedVideos(newVideos);
    } catch (error) {
      console.error('動画の削除に失敗しました:', error);
      Alert.alert('エラー', '動画の削除に失敗しました');
    }
  };

  const renderRightActions = (url: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVideo(url)}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const renderVideoItem = ({ item }: { item: SavedVideo }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.url)}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={styles.videoItem}
        onPress={() => handleVideoSelect(item.url)}
      >
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        </View>
        <Text style={styles.videoTitle}>{item.title}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddVideo(true)}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>新しい動画を追加</Text>
        </TouchableOpacity>

        <FlatList
          data={savedVideos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.url}
          style={styles.videoList}
        />

        <Modal
          visible={showAddVideo}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddVideo(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>新しい動画を追加</Text>
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={styles.urlInput}
                  value={newVideoUrl}
                  onChangeText={setNewVideoUrl}
                  placeholder="YouTube URLを入力"
                  autoCapitalize="none"
                />
                {newVideoUrl.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setNewVideoUrl('')}
                  >
                    <MaterialIcons name="clear" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddVideo(false)}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddVideo}
                  disabled={isLoading}
                >
                  <Text style={styles.confirmButtonText}>
                    {isLoading ? '読み込み中...' : '追加'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  videoList: {
    flex: 1,
  },
  videoItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
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
  thumbnailContainer: {
    width: 120,
    height: 90,
    marginRight: 15,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginBottom: 10,
    marginRight: 15,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 15,
  },
  urlInput: {
    flex: 1,
    padding: 10,
  },
  clearButton: {
    padding: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButtonText: {
    color: 'white',
  },
});

export default VideoSelectScreen; 