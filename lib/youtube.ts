import { google, youtube_v3 } from "googleapis";

/**
 * Initialize the YouTube API client with both API key and/or OAuth token
 * @param accessToken OAuth access token (optional)
 * @returns YouTube API client
 */
export function getYouTubeClient(accessToken?: string): youtube_v3.Youtube {
  // Get API key - needed for API key auth
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  console.log(`YouTube API Key available: ${apiKey ? 'Yes' : 'No'}`);
  console.log(`OAuth token available: ${accessToken ? 'Yes (length: ' + accessToken.length + ')' : 'No'}`);
  
  // For authenticated requests that need user data (like 'mine' parameter),
  // we need to use the OAuth token differently
  if (accessToken) {
    console.log("Creating YouTube client with OAuth token");
    
    // Use the token directly with the googleapis auth library
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    // Return YouTube client with proper OAuth auth
    return google.youtube({
      version: "v3",
      auth: auth
    });
  }
  
  // For unauthenticated requests, use just the API key
  if (!apiKey) {
    throw new Error("YouTube API key is missing. Please set YOUTUBE_API_KEY in .env or .env.local");
  }
  
  console.log("Creating YouTube client with API key");
  return google.youtube({
    version: "v3",
    auth: apiKey,
  });
}

/**
 * Extract error information from YouTube API error response
 */
export function extractYouTubeAPIError(error: unknown): {
  message: string;
  statusCode: number;
  details?: any;
} {
  const errorObj = error as { 
    response?: { 
      data?: { 
        error?: { 
          message?: string; 
          errors?: Array<{ reason?: string }>;
          code?: number;
        } 
      },
      status?: number 
    };
    message?: string;
  };

  console.error("YouTube API Error:", JSON.stringify(errorObj, null, 2));

  let message = "An error occurred with the YouTube API";
  let statusCode = 500;
  let details = undefined;

  if (errorObj.response?.data?.error) {
    const errData = errorObj.response.data.error;
    message = errData.message || message;
    statusCode = errData.code || errorObj.response.status || 500;
    details = errData;
  } else if (errorObj.message) {
    message = errorObj.message;
  }

  return {
    message,
    statusCode,
    details
  };
}