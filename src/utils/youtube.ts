import { YOUTUBE_API_KEY } from '@env';

export const parseYouTubeUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const fetchVideoTitle = async (videoId: string): Promise<string> => {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      return `YouTube Video ${videoId}`;
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.error('YouTube API daily quota exceeded');
        return `YouTube Video ${videoId}`;
      }
      if (response.status === 429) {
        console.error('YouTube API rate limit exceeded');
        return `YouTube Video ${videoId}`;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title;
    }

    console.warn('Video not found or not accessible');
    return `YouTube Video ${videoId}`;
  } catch (error) {
    console.error('Failed to fetch video title:', error);
    return `YouTube Video ${videoId}`;
  }
}; 