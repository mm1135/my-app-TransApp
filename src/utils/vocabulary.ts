import AsyncStorage from '@react-native-async-storage/async-storage';
import { VocabularyItem } from '../types/vocabulary';

const VOCABULARY_STORAGE_KEY = 'vocabulary_items';

export const saveVocabularyItem = async (item: VocabularyItem): Promise<void> => {
  try {
    const items = await getVocabularyItems();
    const exists = items.some(i => i.word === item.word);
    if (!exists) {
      items.push(item);
      await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(items));
    }
  } catch (error) {
    console.error('Error saving vocabulary item:', error);
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

export const deleteVocabularyItem = async (word: string): Promise<void> => {
  try {
    const items = await getVocabularyItems();
    const newItems = items.filter(item => item.word !== word);
    await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(newItems));
  } catch (error) {
    console.error('Error deleting vocabulary item:', error);
  }
};

export const updateVocabularyItemImage = async (word: string, imageUri: string): Promise<void> => {
  try {
    const existingItemsJson = await AsyncStorage.getItem(VOCABULARY_STORAGE_KEY);
    if (!existingItemsJson) return;

    const existingItems: VocabularyItem[] = JSON.parse(existingItemsJson);
    const updatedItems = existingItems.map(item => {
      if (item.word === word) {
        return {
          ...item,
          userImage: imageUri
        };
      }
      return item;
    });

    await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Failed to update vocabulary item image:', error);
    throw error;
  }
}; 