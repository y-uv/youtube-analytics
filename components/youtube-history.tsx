"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { InfoIcon, Clock, ThumbsUp, PlaySquare, User, ListVideo, BarChart2 } from "lucide-react";

// Interfaces for different YouTube data types
interface WatchHistoryItem {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoOwnerChannelTitle: string;
  videoOwnerChannelId: string;
}

interface LikedVideo {
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

interface Playlist {
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

interface ChannelStats {
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

interface Subscription {
  id: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
}

// Response interface types
interface SubscriptionsResponse {
  subscriptions: Subscription[];
  totalResults: number;
  resultsPerPage: number;
  nextPageToken?: string;
  error?: string;
}

interface LikedVideosResponse {
  items: LikedVideo[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
  prevPageToken?: string;
  error?: string;
}

interface PlaylistsResponse {
  items: Playlist[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
  prevPageToken?: string;
  error?: string;
}

// Format duration from ISO 8601
const formatDuration = (isoDuration: string) => {
  if (!isoDuration) return "";
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

// Format numbers for display
const formatNumber = (num: string | number) => {
  return Intl.NumberFormat().format(Number(num));
};

// Debugging component to show session information
const SessionDebug = ({ session }: { session: any }) => {
  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Session Debug Info</AlertTitle>
      <AlertDescription className="mt-2 text-xs">
        <p>Has accessToken: {session?.accessToken ? "Yes" : "No"}</p>
        <p>User: {session?.user?.email || "Not available"}</p>
        <details className="mt-2">
          <summary>Token details (click to expand)</summary>
          <pre className="text-xs mt-2 bg-slate-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </AlertDescription>
    </Alert>
  );
};

export default function YouTubeHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for different data types
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [likedVideos, setLikedVideos] = useState<LikedVideo[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState({
    history: false,
    channel: false,
    subscriptions: false,
    liked: false,
    playlists: false
  });
  
  // Error states
  const [error, setError] = useState<{
    history: string | null;
    channel: string | null;
    subscriptions: string | null;
    liked: string | null;
    playlists: string | null;
  }>({
    history: null,
    channel: null,
    subscriptions: null,
    liked: null,
    playlists: null
  });
  
  const [showDebug, setShowDebug] = useState(true);

  const fetchWatchHistory = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(prev => ({ ...prev, history: true }));
    setError(prev => ({ ...prev, history: null }));
    
    try {
      const res = await fetch('/api/youtube/watch-history');
      const data = await res.json();
      
      // Log to console for debugging
      console.log('[Watch History API]', data);
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setWatchHistory(data);
    } catch (err: unknown) {
      console.error("[Watch History Error]", err);
      setError(prev => ({ ...prev, history: (err as Error).message || "An unknown error occurred" }));
    } finally {
      setIsLoading(prev => ({ ...prev, history: false }));
    }
  };

  const fetchChannelStats = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(prev => ({ ...prev, channel: true }));
    setError(prev => ({ ...prev, channel: null }));
    
    try {
      const res = await fetch('/api/youtube/channel-stats');
      const data = await res.json();
      
      // Log to console for debugging
      console.log('[Channel Stats API]', data);
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setChannelStats(data);
    } catch (err: unknown) {
      console.error("[Channel Stats Error]", err);
      setError(prev => ({ ...prev, channel: (err as Error).message || "An unknown error occurred" }));
    } finally {
      setIsLoading(prev => ({ ...prev, channel: false }));
    }
  };

  const fetchSubscriptions = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(prev => ({ ...prev, subscriptions: true }));
    setError(prev => ({ ...prev, subscriptions: null }));
    
    try {
      const res = await fetch('/api/youtube/subscriptions');
      const data = await res.json();
      
      // Log to console for debugging
      console.log('[Subscriptions API]', data);
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setSubscriptions(data.subscriptions || []);
    } catch (err: unknown) {
      console.error("[Subscriptions Error]", err);
      setError(prev => ({ ...prev, subscriptions: (err as Error).message || "An unknown error occurred" }));
    } finally {
      setIsLoading(prev => ({ ...prev, subscriptions: false }));
    }
  };

  const fetchLikedVideos = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(prev => ({ ...prev, liked: true }));
    setError(prev => ({ ...prev, liked: null }));
    
    try {
      const res = await fetch('/api/youtube/liked-videos');
      const data: LikedVideosResponse = await res.json();
      
      // Log to console for debugging
      console.log('[Liked Videos API]', data);
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setLikedVideos(data.items || []);
    } catch (err: unknown) {
      console.error("[Liked Videos Error]", err);
      setError(prev => ({ ...prev, liked: (err as Error).message || "An unknown error occurred" }));
    } finally {
      setIsLoading(prev => ({ ...prev, liked: false }));
    }
  };

  const fetchPlaylists = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(prev => ({ ...prev, playlists: true }));
    setError(prev => ({ ...prev, playlists: null }));
    
    try {
      const res = await fetch('/api/youtube/playlists');
      const data: PlaylistsResponse = await res.json();
      
      // Log to console for debugging
      console.log('[Playlists API]', data);
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setPlaylists(data.items || []);
    } catch (err: unknown) {
      console.error("[Playlists Error]", err);
      setError(prev => ({ ...prev, playlists: (err as Error).message || "An unknown error occurred" }));
    } finally {
      setIsLoading(prev => ({ ...prev, playlists: false }));
    }
  };

  // Fetch all data when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      console.log("[Auth] Session is authenticated, fetching data...");
      console.log("[Auth] Session object:", session);
      
      fetchWatchHistory();
      fetchChannelStats();
      fetchSubscriptions();
      fetchLikedVideos();
      fetchPlaylists();
    }
  }, [status, session]);

  // Navigate to detailed exploration page
  const goToExplorationPage = () => {
    router.push('/youtube-data');
  };

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>YouTube Analytics</CardTitle>
          <CardDescription>Sign in to view your YouTube data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            Sign in with your Google account. You'll need to grant permission to access your YouTube data.
          </p>
          <Button 
            onClick={() => signIn("google", { 
              callbackUrl: window.location.href,
              prompt: "consent" // Force consent screen to appear
            })}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-3xl font-bold">Your YouTube Data</h2>
        <div className="flex mt-2 md:mt-0 space-x-2">
          <Button 
            onClick={goToExplorationPage}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            <span>Detailed Exploration</span>
          </Button>
        </div>
      </div>
      
      {/* Show debug info - can be toggled */}
      {showDebug && session && (
        <div className="mb-4">
          <SessionDebug session={session} />
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowDebug(false)}>
              Hide Debug Info
            </Button>
          </div>
        </div>
      )}

      {!showDebug && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
            Show Debug Info
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="channel">
        <TabsList className="mb-4">
          <TabsTrigger value="channel" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Channel</span>
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>Liked Videos</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Watch History</span>
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-1">
            <ListVideo className="h-4 w-4" />
            <span>Playlists</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-1">
            <PlaySquare className="h-4 w-4" />
            <span>Subscriptions</span>
          </TabsTrigger>
        </TabsList>
      
        {/* CHANNEL STATISTICS TAB */}
        <TabsContent value="channel" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Channel Statistics</h3>
            <Button 
              onClick={fetchChannelStats} 
              disabled={isLoading.channel}
            >
              {isLoading.channel ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error.channel && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error.channel}</p>
            </div>
          )}
          
          {isLoading.channel ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : channelStats ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 items-start mb-4">
                  {channelStats.thumbnail && (
                    <img 
                      src={channelStats.thumbnail} 
                      alt={channelStats.title}
                      className="w-20 h-20 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{channelStats.title}</h3>
                    <p className="text-gray-500 text-sm">
                      {channelStats.customUrl ? `youtube.com/${channelStats.customUrl}` : channelStats.id}
                    </p>
                    {channelStats.country && (
                      <Badge variant="outline" className="mt-2">
                        {channelStats.country}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Subscribers</p>
                    <p className="text-2xl font-bold">
                      {channelStats.hiddenSubscriberCount ? 
                        "Hidden" : 
                        formatNumber(channelStats.subscriberCount)}
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Views</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(channelStats.viewCount)}
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Videos</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(channelStats.videoCount)}
                    </p>
                  </div>
                </div>
                
                {channelStats.description && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                      {channelStats.description}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  Channel created: {new Date(channelStats.publishedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No channel data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* LIKED VIDEOS TAB */}
        <TabsContent value="liked" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Liked Videos</h3>
            <Button 
              onClick={fetchLikedVideos} 
              disabled={isLoading.liked}
            >
              {isLoading.liked ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error.liked && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error.liked}</p>
            </div>
          )}
          
          {isLoading.liked ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-24 w-32 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : likedVideos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p>No liked videos found or accessible via the API. You may need to make your likes public in YouTube settings.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {likedVideos.map((video) => (
                <Card key={video.videoId || video.id} className="overflow-hidden">
                  <div className="flex p-4">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-24 object-cover rounded mr-4"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-slate-200 rounded mr-4 flex items-center justify-center">
                        <span className="text-sm text-slate-500">No thumbnail</span>
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <div className="flex items-start justify-between">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-medium text-blue-600 hover:underline"
                        >
                          {video.title || "Untitled Video"}
                        </a>
                        {video.duration && (
                          <Badge variant="secondary" className="ml-2">
                            {formatDuration(video.duration)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <a 
                          href={`https://www.youtube.com/channel/${video.channelId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:underline"
                        >
                          {video.channelTitle || "Unknown channel"}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{formatNumber(video.viewCount)} views</span>
                        <span>•</span>
                        <span>{formatNumber(video.likeCount)} likes</span>
                        {video.commentCount && video.commentCount !== "0" && (
                          <>
                            <span>•</span>
                            <span>{formatNumber(video.commentCount)} comments</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-auto">
                        Liked: {new Date(video.publishedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
                
        {/* WATCH HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Watch History</h3>
            <Button 
              onClick={fetchWatchHistory} 
              disabled={isLoading.history}
            >
              {isLoading.history ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error.history && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error.history}</p>
            </div>
          )}
          
          {isLoading.history ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-24 w-32 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : watchHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p>No watch history found or accessible via the API.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {watchHistory.map((video) => (
                <Card key={video.videoId || video.id} className="overflow-hidden">
                  <div className="flex p-4">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-24 object-cover rounded mr-4"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-slate-200 rounded mr-4 flex items-center justify-center">
                        <span className="text-sm text-slate-500">No thumbnail</span>
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-blue-600 hover:underline"
                      >
                        {video.title || "Untitled Video"}
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          {video.videoOwnerChannelTitle || "Unknown channel"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-auto">
                        Watched: {new Date(video.publishedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* PLAYLISTS TAB */}
        <TabsContent value="playlists" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Your Playlists</h3>
            <Button 
              onClick={fetchPlaylists} 
              disabled={isLoading.playlists}
            >
              {isLoading.playlists ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error.playlists && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error.playlists}</p>
            </div>
          )}
          
          {isLoading.playlists ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p>No playlists found or accessible via the API.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <Card key={playlist.id} className="overflow-hidden h-full flex flex-col">
                  <div className="relative">
                    {playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail}
                        alt={playlist.title}
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-200 flex items-center justify-center">
                        <span className="text-sm text-slate-500">No thumbnail</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-2 py-1 m-2 rounded">
                      {playlist.itemCount} videos
                    </div>
                    <Badge 
                      className="absolute top-0 left-0 m-2"
                      variant={playlist.privacy === "public" ? "default" : "secondary"}
                    >
                      {playlist.privacy}
                    </Badge>
                  </div>
                  <CardContent className="pt-4 flex-1">
                    <h4 className="font-medium mb-1 line-clamp-2">
                      <a 
                        href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {playlist.title}
                      </a>
                    </h4>
                    {playlist.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {playlist.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-gray-500 border-t mt-auto">
                    Created: {new Date(playlist.publishedAt).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* SUBSCRIPTIONS TAB */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Subscriptions</h3>
            <Button 
              onClick={fetchSubscriptions} 
              disabled={isLoading.subscriptions}
            >
              {isLoading.subscriptions ? "Loading..." : "Refresh"}
            </Button>
          </div>
          
          {error.subscriptions && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error.subscriptions}</p>
            </div>
          )}
          
          {isLoading.subscriptions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p>No subscriptions found or accessible via the API.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="overflow-hidden">
                  <div className="flex p-4 items-center">
                    {sub.thumbnail ? (
                      <img
                        src={sub.thumbnail}
                        alt={sub.title}
                        className="w-16 h-16 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded-full mr-4 flex items-center justify-center">
                        <span className="text-sm text-slate-500">No image</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <a
                        href={`https://www.youtube.com/channel/${sub.channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium text-blue-600 hover:underline"
                      >
                        {sub.title}
                      </a>
                      <p className="text-xs text-gray-500">
                        Subscribed: {new Date(sub.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}