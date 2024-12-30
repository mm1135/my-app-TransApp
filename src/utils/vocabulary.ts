import AsyncStorage from '@react-native-async-storage/async-storage';
import { VocabularyItem } from '../types/vocabulary';
import { Alert } from 'react-native';

const VOCABULARY_STORAGE_KEY = 'vocabulary_items';

export const saveVocabularyItem = async (item: VocabularyItem): Promise<boolean> => {
  try {
    const existingItems = await getVocabularyItems();
    const isDuplicate = existingItems.some(
      existingItem => existingItem.word.toLowerCase() === item.word.toLowerCase()
    );

    if (isDuplicate) {
      Alert.alert(
        '登録済みの単語',
        `"${item.word}"は既に単語帳に登録されています。`,
        [
          {
            text: 'OK',
            style: 'default',
          }
        ]
      );
      return false;
    }

    const updatedItems = [...existingItems, item];
    await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(updatedItems));
    Alert.alert('保存完了', '単語を保存しました');
    return true;
  } catch (error) {
    console.error('Error saving vocabulary item:', error);
    Alert.alert('エラー', '単語の保存に失敗しました');
    return false;
  }
};

export const getVocabularyItems = async (): Promise<VocabularyItem[]> => {
  try {
    const items = await AsyncStorage.getItem(VOCABULARY_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Error getting vocabulary items:', error);
    return [];
  }
};

export const deleteVocabularyItem = async (word: string) => {
  try {
    const items = await getVocabularyItems();
    const updatedItems = items.filter(item => item.word !== word);
    await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error deleting vocabulary item:', error);
    throw error;
  }
};

export const updateVocabularyItemImage = async (word: string, imageUri: string) => {
  try {
    const items = await getVocabularyItems();
    const updatedItems = items.map(item => {
      if (item.word === word) {
        return { ...item, userImage: imageUri };
      }
      return item;
    });
    await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error updating vocabulary item image:', error);
    throw error;
  }
}; 