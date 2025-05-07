import { LikedVideo, Playlist, Subscription } from "@/types/youtube";

// Function to generate monthly activity data based on YouTube activity
export function generateMonthlyActivityData(
  likedVideos: LikedVideo[] = [],
  playlists: Playlist[] = [],
  subscriptions: Subscription[] = []
) {
  // Get current date and go back 12 months
  const now = new Date();
  const monthlyData: { name: string; month: number; year: number; likes: number; playlists: number; subscriptions: number; total: number; }[] = [];
  
  // Create an array of the last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString().substr(2, 2); // Get last 2 digits of year
    
    monthlyData.push({
      name: `${monthName} '${year}`,
      month: date.getMonth(),
      year: date.getFullYear(),
      likes: 0,
      playlists: 0,
      subscriptions: 0,
      total: 0
    });
  }

  // Count likes by month
  likedVideos.forEach(video => {
    if (!video.publishedAt) return;
    
    const date = new Date(video.publishedAt);
    const matchingMonth = monthlyData.find(data => 
      data.month === date.getMonth() && data.year === date.getFullYear()
    );
    
    if (matchingMonth) {
      matchingMonth.likes += 1;
      matchingMonth.total += 1;
    }
  });

  // Count playlist creations by month
  playlists.forEach(playlist => {
    if (!playlist.publishedAt) return;
    
    const date = new Date(playlist.publishedAt);
    const matchingMonth = monthlyData.find(data => 
      data.month === date.getMonth() && data.year === date.getFullYear()
    );
    
    if (matchingMonth) {
      matchingMonth.playlists += 1;
      matchingMonth.total += 1;
    }
  });

  // Count subscriptions by month
  subscriptions.forEach(subscription => {
    if (!subscription.publishedAt) return;
    
    const date = new Date(subscription.publishedAt);
    const matchingMonth = monthlyData.find(data => 
      data.month === date.getMonth() && data.year === date.getFullYear()
    );
    
    if (matchingMonth) {
      matchingMonth.subscriptions += 1;
      matchingMonth.total += 1;
    }
  });

  return monthlyData;
}

// Function to generate category breakdown data for pie chart
export function generateActivityBreakdownData(
  likedVideos: LikedVideo[] = [],
  playlists: Playlist[] = [],
  subscriptions: Subscription[] = []
) {
  const likesCount = likedVideos.length;
  const playlistsCount = playlists.length;
  const subscriptionsCount = subscriptions.length;
  
  return [
    { name: "Liked Videos", value: likesCount },
    { name: "Playlists", value: playlistsCount },
    { name: "Subscriptions", value: subscriptionsCount },
  ].filter(item => item.value > 0); // Only include non-zero values
}