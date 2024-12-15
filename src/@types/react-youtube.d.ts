declare module 'react-youtube' {
    import { Component } from 'react';
  
    interface YouTubeProps {
      videoId: string;
      opts?: {
        height?: string;
        width?: string;
        playerVars?: {
          autoplay?: number;
          controls?: number;
          modestbranding?: number;
          rel?: number;
        };
      };
      onReady?: (event: { target: any }) => void;
      onPlay?: (event: { target: any }) => void;
      onPause?: (event: { target: any }) => void;
      onEnd?: (event: { target: any }) => void;
      onError?: (event: { target: any }) => void;
      onStateChange?: (event: { data: number; target: any }) => void;
    }
  
    export default class YouTube extends Component<YouTubeProps> {}
  }