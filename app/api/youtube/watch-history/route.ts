import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

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

  const youtube = google.youtube({
    version: "v3",
    auth: session.accessToken,
  });

  try {
    const response = await youtube.playlistItems.list({
      part: ["snippet,contentDetails"],
      playlistId: "HL", // 'HL' is the special ID for Watch History
      maxResults: 25,
    });

    if (!response.data.items) {
      return NextResponse.json([]);
    }

    const watchHistory = response.data.items.map((item) => ({
      id: item.id || "",
      videoId: item.contentDetails?.videoId || "",
      title: item.snippet?.title || "Untitled Video",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url || "",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
      videoOwnerChannelTitle: item.snippet?.videoOwnerChannelTitle || "Unknown Channel",
      videoOwnerChannelId: item.snippet?.videoOwnerChannelId || "",
    }));

    return NextResponse.json(watchHistory);
  } catch (error: unknown) {
    const errorObj = error as { 
      response?: { 
        data?: { 
          error?: { 
            message?: string; 
            errors?: Array<{ reason?: string }>
          } 
        } 
      };
      message?: string;
    };

    console.error(
      "Error fetching YouTube watch history:", 
      errorObj.response?.data || errorObj.message || "Unknown error"
    );

    let errorMessage = "Failed to fetch YouTube watch history.";
    let statusCode = 500;

    if (errorObj.response?.data?.error) {
      const errData = errorObj.response.data.error;
      errorMessage = errData.message || errorMessage;

      if (errData.errors?.[0]) {
        const specificError = errData.errors[0];
        if (specificError.reason === "authError" || 
            specificError.reason === "forbidden" || 
            specificError.reason === "insufficientPermissions") {
          statusCode = 403;
          errorMessage = `YouTube API Authorization Error: ${errData.message || "Access denied"}. Please ensure permissions are granted or try re-logging.`;
        } else if (specificError.reason === "playlistNotFound") {
          statusCode = 404;
          errorMessage = "Watch history playlist not found.";
        }
      }
    }

    return NextResponse.json(
      { error: errorMessage, details: errorObj.message || "No details available" },
      { status: statusCode }
    );
  }
}