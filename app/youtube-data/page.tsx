"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import YouTubeHistory from "@/components/youtube-history";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function YouTubeDataPage() {
  const { data: session, status } = useSession();
  const [isDebugVisible, setIsDebugVisible] = useState(true);
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">      <header className="flex flex-row justify-between items-center mb-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push('/')} 
            className="gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            variant="ghost" 
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide"><path d="m15 18-6-6 6-6"/></svg>
            <span className="flex items-center">Back to Dashboard</span>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {status === "loading" && <p>Loading...</p>}
          
          {status === "authenticated" && session?.user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">{session.user.name}</p>
                <button 
                  onClick={() => signOut({ callbackUrl: "/youtube-data" })} 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Sign out
                </button>
              </div>
              {session.user.image && (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full"
                />
              )}
            </div>
          )}
          
          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("google", { 
                callbackUrl: "/youtube-data",
                prompt: "consent" 
              })}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Sign in with Google for YouTube Data
            </button>
          )}
        </div>
      </header>      {status === "authenticated" ? (
        <YouTubeHistory />
      ): status === "unauthenticated" ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Sign in to Access Your YouTube Data</h2>
          <p className="mb-8 max-w-2xl mx-auto text-gray-600">
            This tool uses the YouTube Data API to fetch your liked videos, subscriptions, 
            playlists, and channel information. You must sign in with Google and grant 
            permission to access your YouTube data.
          </p>
          <button
            onClick={() => signIn("google", { 
              callbackUrl: "/youtube-data",
              prompt: "consent" 
            })}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md text-lg"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
}