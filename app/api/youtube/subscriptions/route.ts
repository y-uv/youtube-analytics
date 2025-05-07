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
    // Cast the result to ExtendedSession to access the accessToken
    const session = await getServerSession(authOptions) as ExtendedSession;
  
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized: No active session or access token." },
        { status: 401 }
      );
    }
    
    console.log("Session authenticated, token length:", session.accessToken.length);
  
    const youtube = getYouTubeClient(session.accessToken);
  
    try {
      console.log("Fetching YouTube subscriptions...");
      
      const response = await youtube.subscriptions.list({
        part: ["snippet", "contentDetails"],
        mine: true,
        maxResults: 50
      });
  
      console.log("Subscriptions response received:", response.data.pageInfo);
      
      if (!response.data.items) {
        return NextResponse.json({ 
          subscriptions: [],
          totalResults: 0,
          resultsPerPage: 0
        });
      }
  
      const subscriptions = response.data.items.map((item) => ({
        id: item.id || "",
        channelId: item.snippet?.resourceId?.channelId || "",
        title: item.snippet?.title || "Unknown Channel",
        description: item.snippet?.description || "",
        publishedAt: item.snippet?.publishedAt || "",
        thumbnail: item.snippet?.thumbnails?.default?.url || 
                  item.snippet?.thumbnails?.medium?.url || 
                  "",
      }));
  
      return NextResponse.json({
        subscriptions,
        totalResults: response.data.pageInfo?.totalResults || 0,
        resultsPerPage: response.data.pageInfo?.resultsPerPage || 0,
        nextPageToken: response.data.nextPageToken,
      });
    } catch (error: unknown) {
      const { message, statusCode, details } = extractYouTubeAPIError(error);
      
      console.error("Error fetching YouTube subscriptions:", details || message);
  
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