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
  // Cast the result to ExtendedSession to access the accessToken
  const session = await getServerSession(authOptions) as ExtendedSession;

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized: No active session or access token." },
      { status: 401 }
    );
  }

  const youtube = getYouTubeClient(session.accessToken);

  try {
    console.log("Fetching user playlists from YouTube API...");
    
    const response = await youtube.playlists.list({
      part: ["snippet,contentDetails,status"],
      mine: true,
      maxResults: 50,
    });

    console.log(`YouTube API response status: ${response.status}`);
    console.log(`Playlists returned: ${response.data.items?.length || 0}`);

    if (!response.data.items || response.data.items.length === 0) {
      console.log("No playlists found or accessible");
      return NextResponse.json({ 
        items: [],
        message: "No playlists found or accessible" 
      });
    }

    const playlists = response.data.items.map((item) => ({
      id: item.id || "",
      title: item.snippet?.title || "Untitled Playlist",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || 
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url || "",
      publishedAt: item.snippet?.publishedAt || "",
      itemCount: item.contentDetails?.itemCount || 0,
      privacy: item.status?.privacyStatus || "private",
      channelId: item.snippet?.channelId || "",
      channelTitle: item.snippet?.channelTitle || "",
    }));

    console.log(`Processed ${playlists.length} playlists successfully`);

    return NextResponse.json({
      items: playlists,
      pageInfo: response.data.pageInfo,
      nextPageToken: response.data.nextPageToken,
      prevPageToken: response.data.prevPageToken,
    });
  } catch (error: unknown) {
    const { message, statusCode, details } = extractYouTubeAPIError(error);
    
    console.error("Error fetching YouTube playlists:", details || message);
    console.error("Status code:", statusCode);

    return NextResponse.json(
      { error: message, details: details || "No details available" },
      { status: statusCode }
    );
  }
}