import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReviewSettings {
  showJapaneseTranslation: boolean;
  reviewMode: 'word' | 'sentence' | 'both';
  randomizeOrder: boolean;
  showProgress: boolean;
  showStats: boolean;
}

interface SettingsContextType {
  settings: ReviewSettings;
  updateSettings: (newSettings: Partial<ReviewSettings>) => Promise<void>;
}

const defaultSettings: ReviewSettings = {
  showJapaneseTranslation: true,
  reviewMode: 'word',
  randomizeOrder: true,
  showProgress: true,
  showStats: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ReviewSettings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('review_settings');
        if (savedSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<ReviewSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem('review_settings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 