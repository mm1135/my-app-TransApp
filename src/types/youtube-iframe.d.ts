import { YoutubeIframeProps } from 'react-native-youtube-iframe';

declare module 'react-native-youtube-iframe' {
  export interface YoutubeIframeProps {
    onProgress?: (event: { currentTime: number }) => void;
  }
} 