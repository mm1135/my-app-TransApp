import { DictionaryResponse } from '../types/dictionary';

const DICTIONARY_API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export const fetchWordMeaning = async (word: string): Promise<DictionaryResponse | null> => {
  try {
    const response = await fetch(`${DICTIONARY_API_BASE_URL}/${word.toLowerCase()}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error('Dictionary API Error:', error);
    return null;
  }
}; 