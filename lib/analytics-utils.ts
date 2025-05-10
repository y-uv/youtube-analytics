import type { LikedVideo, Playlist, Subscription, WatchHistoryItem } from "@/types/youtube";

// Define constant colors with our color scheme
const CHART_COLORS = {
  likes: "#FF5252",     // Red for likes
  playlists: "#4CAF50", // Green for playlists
  subscriptions: "#2196F3", // Blue for subscriptions
};

/**
 * Generates monthly activity data for chart visualization
 */
export function generateMonthlyActivityData(
  likedVideos: LikedVideo[],
  playlists: Playlist[],
  subscriptions: Subscription[]
) {
  // Create a map to store monthly data
  const monthMap = new Map();
  
  // Process liked videos
  likedVideos.forEach(video => {
    const date = new Date(video.publishedAt);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, { name: monthYear, likes: 0, playlists: 0, subscriptions: 0, total: 0 });
    }
    
    const monthData = monthMap.get(monthYear);
    monthData.likes += 1;
    monthData.total += 1;
  });
  
  // Process playlists
  playlists.forEach(playlist => {
    const date = new Date(playlist.publishedAt);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, { name: monthYear, likes: 0, playlists: 0, subscriptions: 0, total: 0 });
    }
    
    const monthData = monthMap.get(monthYear);
    monthData.playlists += 1;
    monthData.total += 1;
  });
  
  // Process subscriptions
  subscriptions.forEach(subscription => {
    const date = new Date(subscription.publishedAt);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, { name: monthYear, likes: 0, playlists: 0, subscriptions: 0, total: 0 });
    }
    
    const monthData = monthMap.get(monthYear);
    monthData.subscriptions += 1;
    monthData.total += 1;
  });
  
  // Convert map to array and sort chronologically
  return Array.from(monthMap.values()).sort((a, b) => {
    const [monthA, yearA] = a.name.split(' ');
    const [monthB, yearB] = b.name.split(' ');
    
    const yearDiff = parseInt(yearA) - parseInt(yearB);
    if (yearDiff !== 0) return yearDiff;
    
    // Month sorting
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthA) - months.indexOf(monthB);
  });
}

/**
 * Generates activity breakdown data for pie chart visualization
 */
export function generateActivityBreakdownData(
  likedVideos: LikedVideo[],
  playlists: Playlist[],
  subscriptions: Subscription[]
) {
  return [
    { name: "Likes", value: likedVideos.length, color: CHART_COLORS.likes },
    { name: "Playlists", value: playlists.length, color: CHART_COLORS.playlists },
    { name: "Subscriptions", value: subscriptions.length, color: CHART_COLORS.subscriptions }
  ];
}