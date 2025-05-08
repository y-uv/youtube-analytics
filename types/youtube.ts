// YouTube data interfaces used throughout the app

export interface WatchHistoryItem {
  header?: string;
  title?: string;
  titleUrl?: string;
  subtitles?: {
    name: string;
    url: string;
  }[];
  time?: string;
  products?: string[];
  activityControls?: string[];
  // Additional fields that may be present in some entries
  videoId?: string;
  description?: string;
  thumbnail?: string;
  videoOwnerChannelTitle?: string;
  videoOwnerChannelId?: string;
}

export interface LikedVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  category: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  itemCount: number;
  privacy: string;
  channelId: string;
  channelTitle: string;
}

export interface ChannelStats {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
  country: string;
  uploadPlaylistId: string;
  bannerImageUrl: string;
}

export interface Subscription {
  id: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
}

// Response interface types
export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  totalResults: number;
  resultsPerPage: number;
  nextPageToken?: string;
  error?: string;
}

export interface LikedVideosResponse {
  items: LikedVideo[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
  prevPageToken?: string;
  error?: string;
}

export interface PlaylistsResponse {
  items: Playlist[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
  prevPageToken?: string;
  error?: string;
}

// YouTube activity statistics interfaces
export interface MonthlyActivity {
  name: string;
  month: number;
  year: number;
  likes: number;
  playlists: number;
  subscriptions: number;
  total: number;
}

export interface ActivityBreakdown {
  name: string;
  value: number;
}