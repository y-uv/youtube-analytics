"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { InfoIcon } from "lucide-react";

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

export default function YouTubeHistory() {
  const { data: session, status } = useSession();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchHistory = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/youtube/watch-history');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Error: ${res.status}`);
      }
      
      setWatchHistory(data);
    } catch (err: unknown) {
      console.error("Failed to fetch watch history:", err);
      setError((err as Error).message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchWatchHistory();
    }
  }, [status]);

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
          <CardTitle>YouTube History</CardTitle>
          <CardDescription>Sign in to view your YouTube history</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => signIn("google")}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Display YouTube API access information
  if (status === "authenticated") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your YouTube Data</h2>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>YouTube API Access</AlertTitle>
          <AlertDescription className="mt-2">
            <p>Currently, this app is using basic Google authentication without YouTube API access.</p>
            <p className="mt-2">To access your YouTube data, the app needs additional permissions:</p>
            <div className="mt-3">
              <h3 className="font-medium">For Development Testing:</h3>
              <ul className="list-disc pl-5 mt-1">
                <li>Go to your Google Cloud Console project</li>
                <li>Navigate to "APIs & Services" &gt; "OAuth consent screen"</li>
                <li>Add your email address as a test user</li>
                <li>Update the scopes in the app to include "https://www.googleapis.com/auth/youtube.readonly"</li>
              </ul>
            </div>
            <div className="mt-3">
              <h3 className="font-medium">For Production Use:</h3>
              <ul className="list-disc pl-5 mt-1">
                <li>Complete Google's verification process</li>
                <li>Submit your app for review, justifying your use of YouTube API scopes</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Mock display of what data would be shown */}
        <Card>
          <CardHeader>
            <CardTitle>Watch History Preview</CardTitle>
            <CardDescription>Example of what you would see with full YouTube API access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex p-4 border rounded">
                  <div className="w-32 h-24 bg-slate-200 rounded mr-4 flex items-center justify-center">
                    <span className="text-sm text-slate-500">Thumbnail</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-lg font-medium">Example Video Title {i}</span>
                    <span className="text-sm text-gray-600">Example Channel</span>
                    <span className="text-xs text-gray-500 mt-auto">
                      Watched: {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}