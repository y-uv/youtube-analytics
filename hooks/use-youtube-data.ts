import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { LikedVideo, Playlist, Subscription, ChannelStats, WatchHistoryItem } from '@/types/youtube';

// Base fetcher function for API calls
const fetchFromAPI = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error ${response.status}: Failed to fetch data`);
  }

  return response.json() as Promise<T>;
};

// Hook for fetching liked videos with caching
export function useLikedVideos() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  return useQuery<{ items: LikedVideo[] }>({
    queryKey: ['youtube', 'liked-videos'],
    queryFn: () => fetchFromAPI('/api/youtube/liked-videos'),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for fetching playlists with caching
export function usePlaylists() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  return useQuery<{ items: Playlist[] }>({
    queryKey: ['youtube', 'playlists'],
    queryFn: () => fetchFromAPI('/api/youtube/playlists'),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for fetching subscriptions with caching
export function useSubscriptions() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  return useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ['youtube', 'subscriptions'],
    queryFn: () => fetchFromAPI('/api/youtube/subscriptions'),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for fetching channel stats with caching
export function useChannelStats() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  return useQuery<ChannelStats>({
    queryKey: ['youtube', 'channel-stats'],
    queryFn: () => fetchFromAPI('/api/youtube/channel-stats'),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for fetching watch history with caching
export function useWatchHistory() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  return useQuery<WatchHistoryItem[]>({
    queryKey: ['youtube', 'watch-history'],
    queryFn: () => fetchFromAPI('/api/youtube/watch-history'),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Convenience hook that combines all YouTube data
export function useAllYouTubeData() {
  const likedVideosQuery = useLikedVideos();
  const playlistsQuery = usePlaylists();
  const subscriptionsQuery = useSubscriptions();
  const channelStatsQuery = useChannelStats();
  const watchHistoryQuery = useWatchHistory();
  
  const isLoading = 
    likedVideosQuery.isLoading || 
    playlistsQuery.isLoading || 
    subscriptionsQuery.isLoading || 
    channelStatsQuery.isLoading ||
    watchHistoryQuery.isLoading;
    
  const isError = 
    likedVideosQuery.isError || 
    playlistsQuery.isError || 
    subscriptionsQuery.isError || 
    channelStatsQuery.isError ||
    watchHistoryQuery.isError;
    
  const error = 
    likedVideosQuery.error || 
    playlistsQuery.error || 
    subscriptionsQuery.error || 
    channelStatsQuery.error ||
    watchHistoryQuery.error;
  
  return {
    likedVideos: likedVideosQuery.data?.items || [],
    playlists: playlistsQuery.data?.items || [],
    subscriptions: subscriptionsQuery.data?.subscriptions || [],
    channelStats: channelStatsQuery.data,
    watchHistory: watchHistoryQuery.data || [],
    isLoading,
    isError,
    error,
    refetch: () => {
      likedVideosQuery.refetch();
      playlistsQuery.refetch();
      subscriptionsQuery.refetch();
      channelStatsQuery.refetch();
      watchHistoryQuery.refetch();
    }
  };
}