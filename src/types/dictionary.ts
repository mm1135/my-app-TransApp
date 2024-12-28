export type DictionaryResponse = {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
};

export type WordMeaning = {
  definition: string;
  japaneseTranslation: string | null;
  partOfSpeech?: string;
  example?: string;
}; 