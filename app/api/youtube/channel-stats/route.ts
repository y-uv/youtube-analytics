import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { getYouTubeClient, extractYouTubeAPIError } from "@/lib/youtube";

// Define extended session interface that includes accessToken
interface ExtendedSession extends Session {
  accessToken?: string;
}

export async function GET() {
  try {
    // Use type assertion to resolve TypeScript error with authOptions
    const session = await getServerSession(authOptions as any) as ExtendedSession;
  
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized: No active session or access token." },
        { status: 401 }
      );
    }
    
    console.log("Session authenticated for channel stats, token length:", session.accessToken.length);
  
    const youtube = getYouTubeClient(session.accessToken);
  
    try {
      console.log("Fetching channel stats from YouTube API...");
      
      // First, get the authenticated user's channel ID
      const channelResponse = await youtube.channels.list({
        part: ["snippet", "contentDetails", "statistics", "brandingSettings"],
        mine: true,
      });
  
      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        return NextResponse.json(
          { error: "No channel found for the authenticated user." },
          { status: 404 }
        );
      }
  
      const channel = channelResponse.data.items[0];
      
      // Extract relevant statistics and information
      const channelStats = {
        id: channel.id || "",
        title: channel.snippet?.title || "Unknown Channel",
        description: channel.snippet?.description || "",
        customUrl: channel.snippet?.customUrl || "",
        publishedAt: channel.snippet?.publishedAt || "",
        thumbnail: channel.snippet?.thumbnails?.default?.url || "",
        viewCount: channel.statistics?.viewCount || "0",
        subscriberCount: channel.statistics?.subscriberCount || "0",
        hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount || false,
        videoCount: channel.statistics?.videoCount || "0",
        country: channel.snippet?.country || "Unknown",
        uploadPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || "",
        bannerImageUrl: channel.brandingSettings?.image?.bannerExternalUrl || "",
      };
  
      return NextResponse.json(channelStats);
    } catch (error: unknown) {
      const { message, statusCode, details } = extractYouTubeAPIError(error);
      
      console.error("Error fetching YouTube channel stats:", details || message);
  
      // Format a more user-friendly error message
      const userMessage = "YouTube API Authorization Error: " + message + 
                        ". Please ensure permissions are granted or try re-logging.";
  
      return NextResponse.json(
        { error: userMessage, details: details || "No details available" },
        { status: statusCode }
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