import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import VideoSelectScreen from './src/screens/VideoSelectScreen';
import VideoLearningScreen from './src/screens/VideoLearningScreen';
import VocabularyListScreen from './src/screens/VocabularyListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import { RootStackParamList, RootTabParamList, VideoStackParamList } from './src/types/navigation';
import { SettingsProvider } from './src/contexts/SettingsContext';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<VideoStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

function VideoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="VideoSelect" 
        component={VideoSelectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VideoLearning"
        component={VideoLearningScreen}
        options={{ 
          headerShown: true,
          headerTitle: '学習',
          headerBackTitle: '戻る'
        }}
      />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{
          headerShown: true,
          headerTitle: '動画',
          headerBackTitle: '戻る'
        }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          headerShown: true,
          headerTitle: '復習',
          headerBackTitle: '戻る'
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="動画"
        component={VideoStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="単語帳"
        component={VocabularyListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="設定"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
