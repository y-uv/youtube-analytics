import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { youtube_v3 } from "googleapis";
import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { getYouTubeClient, extractYouTubeAPIError } from "@/lib/youtube";

// Define extended session interface that includes accessToken
interface ExtendedSession extends Session {
  accessToken?: string;
}

// Define an interface for video details map
interface VideoDetailsMap {
  [key: string]: youtube_v3.Schema$Video;
}

export async function GET() {
  try {
    // Cast the result to ExtendedSession to access the accessToken
    // Fix the TypeScript error by passing authOptions directly without array
    const session = await getServerSession(authOptions as any) as ExtendedSession;
  
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized: No active session or access token." },
        { status: 401 }
      );
    }
    
    console.log("Session authenticated for liked videos, token length:", session.accessToken.length);
  
    // Use our utility function to get the YouTube client
    const youtube = getYouTubeClient(session.accessToken);
  
    try {
      console.log("Fetching liked videos from YouTube API...");
      
      // Fetch liked videos (LL is the special playlist ID for liked videos)
      const response = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: "LL", // "LL" is the special ID for Liked Videos
        maxResults: 50,
      });
  
      console.log(`YouTube API response status: ${response.status}`);
      console.log(`Items returned: ${response.data.items?.length || 0}`);
  
      if (!response.data.items || response.data.items.length === 0) {
        console.log("No liked videos found or accessible");
        return NextResponse.json({ 
          items: [],
          message: "No liked videos found or API access is restricted" 
        });
      }
  
      // Get additional video details for each liked video
      const videoIds = response.data.items.map(
        item => item.contentDetails?.videoId || ""
      ).filter(id => id !== "");
  
      let videoDetails: VideoDetailsMap = {};
      
      if (videoIds.length > 0) {
        const videosResponse = await youtube.videos.list({
          part: ["contentDetails", "statistics", "snippet"],
          id: videoIds,
        });
        
        if (videosResponse.data.items) {
          videoDetails = videosResponse.data.items.reduce((acc: VideoDetailsMap, video) => {
            if (video.id) {
              acc[video.id] = video;
            }
            return acc;
          }, {});
        }
      }
  
      const likedVideos = response.data.items.map((item) => {
        const videoId = item.contentDetails?.videoId || "";
        const videoDetail = videoId ? videoDetails[videoId] || {} : {};
        
        return {
          id: item.id || "",
          videoId: videoId,
          title: item.snippet?.title || "Untitled Video",
          description: item.snippet?.description || "",
          thumbnail: item.snippet?.thumbnails?.high?.url || 
                    item.snippet?.thumbnails?.medium?.url ||
                    item.snippet?.thumbnails?.default?.url || "",
          publishedAt: item.snippet?.publishedAt || "",
          channelId: item.snippet?.channelId || item.snippet?.videoOwnerChannelId || "",
          channelTitle: item.snippet?.channelTitle || item.snippet?.videoOwnerChannelTitle || "Unknown Channel",
          // Additional details from videos.list
          duration: videoDetail.contentDetails?.duration || "",
          viewCount: videoDetail.statistics?.viewCount || "0",
          likeCount: videoDetail.statistics?.likeCount || "0",
          commentCount: videoDetail.statistics?.commentCount || "0",
          category: videoDetail.snippet?.categoryId || "",
        };
      });
  
      console.log(`Processed ${likedVideos.length} liked videos successfully`);
  
      return NextResponse.json({
        items: likedVideos,
        pageInfo: response.data.pageInfo,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken,
      });
    } catch (error: unknown) {
      const { message, statusCode, details } = extractYouTubeAPIError(error);
      
      console.error("Error fetching YouTube liked videos:", details || message);
      
      // Special handling for common liked videos playlist issues
      let errorMessage = message;
      let finalStatusCode = statusCode;
      
      if (statusCode === 404) {
        errorMessage = "Liked videos are not accessible. You may need to make your likes public in YouTube settings.";
      } else if (statusCode === 403) {
        errorMessage = "Access to liked videos is forbidden. This could be due to privacy settings.";
      } else {
        errorMessage = "YouTube API Authorization Error: " + message + 
                       ". Please ensure permissions are granted or try re-logging.";
      }
  
      return NextResponse.json(
        { error: errorMessage, details: details || "No details available" },
        { status: finalStatusCode }
      );
    }
  } catch (sessionError) {
    console.error("Session error:", sessionError);
    return NextResponse.json(
      { error: "Failed to get session. Please try logging in again." },
      { status: 401 }
    );
  }
}