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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoPlayer from '../components/VideoPlayer';
import { parseYouTubeUrl } from '../utils/youtube';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { fetchSubtitles, Subtitle } from '../utils/subtitles';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

type VideoLearningScreenRouteProp = RouteProp<RootStackParamList, 'VideoLearning'>;

type SavedVideo = {
  title: string;
  url: string;
  thumbnail: string;
};

const SAVED_VIDEOS_KEY = 'saved_videos';

export default function VideoLearningScreen() {
  const route = useRoute<VideoLearningScreenRouteProp>();
  const [videoId, setVideoId] = useState<string | null>(route.params?.videoId || null);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [subtitles, setSubtitles] = useState<Array<Subtitle>>([]);

  useEffect(() => {
    loadSavedVideos();
  }, []);

  useEffect(() => {
    if (videoId) {
      loadSubtitles(videoId);
    }
  }, [videoId]);

  const loadSubtitles = async (id: string) => {
    try {
      const subs = await fetchSubtitles(id);
      setSubtitles(subs);
    } catch (error) {
      console.error('字幕の読み込みに失敗しました:', error);
    }
  };

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

  const saveVideo = async (video: SavedVideo) => {
    try {
      const exists = savedVideos.some(v => v.url === video.url);
      if (exists) {
        Alert.alert('エラー', 'この動画は既に追加されています');
        return;
      }

      const newVideos = [...savedVideos, video];
      await AsyncStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(newVideos));
      setSavedVideos(newVideos);
    } catch (error) {
      console.error('動画の保存に失敗しました:', error);
    }
  };

  const deleteVideo = async (url: string) => {
    try {
      const newVideos = savedVideos.filter(v => v.url !== url);
      await AsyncStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(newVideos));
      setSavedVideos(newVideos);
    } catch (error) {
      console.error('動画の削除に失敗しました:', error);
    }
  };

  const handleAddVideo = async () => {
    const id = parseYouTubeUrl(newVideoUrl);
    if (!id) {
      Alert.alert('エラー', '有効なYouTube URLを入力してください');
      return;
    }

    const newVideo = {
      title: `YouTube Video ${id}`,
      url: newVideoUrl,
      thumbnail: `https://img.youtube.com/vi/${id}/default.jpg`,
    };

    await saveVideo(newVideo);
    setNewVideoUrl('');
    setShowAddVideo(false);
  };

  const handleVideoSelect = async (url: string) => {
    const id = parseYouTubeUrl(url);
    if (id) {
      setVideoId(id);
      setShowVideoSelector(false);
    }
  };

  const renderRightActions = (url: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteVideo(url)}
      >
        <Text style={styles.deleteActionText}>削除</Text>
      </TouchableOpacity>
    );
  };

  const renderVideoItem = ({ item }: { item: SavedVideo }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.url)}>
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
    <SafeAreaView style={styles.container}>
      {!videoId ? (
        <View style={styles.placeholder}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setShowVideoSelector(true);
              setShowAddVideo(false);
            }}
          >
            <Text style={styles.buttonText}>動画を選択</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <VideoPlayer videoId={videoId} subtitles={subtitles} />
      )}

      <Modal
        visible={showVideoSelector}
        animationType="slide"
        onRequestClose={() => {
          setShowVideoSelector(false);
          setShowAddVideo(false);
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>動画を選択</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVideoSelector(false);
                  setShowAddVideo(false);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setShowAddVideo(true);
                setShowVideoSelector(false);
              }}
            >
              <Text style={styles.addButtonText}>新しい動画を追加</Text>
            </TouchableOpacity>

            <FlatList
              data={savedVideos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.url}
              style={styles.videoList}
            />
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>

      <Modal
        visible={showAddVideo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddVideo(false);
          setShowVideoSelector(true);
        }}
      >
        <View style={styles.addVideoModal}>
          <View style={styles.addVideoContent}>
            <Text style={styles.addVideoTitle}>新しい動画を追加</Text>
            <TextInput
              style={styles.urlInput}
              value={newVideoUrl}
              onChangeText={setNewVideoUrl}
              placeholder="YouTube URLを入力"
              autoCapitalize="none"
            />
            <View style={styles.addVideoButtons}>
              <TouchableOpacity
                style={[styles.addVideoButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddVideo(false);
                  setShowVideoSelector(true);
                }}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addVideoButton, styles.confirmButton]}
                onPress={handleAddVideo}
              >
                <Text style={styles.confirmButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#1976d2',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoList: {
    flex: 1,
  },
  videoItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  thumbnailContainer: {
    width: 120,
    height: 90,
    marginRight: 15,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
  },
  deleteAction: {
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addVideoModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addVideoContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  addVideoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  addVideoButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addVideoButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
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
    color: '#fff',
  },
}); 