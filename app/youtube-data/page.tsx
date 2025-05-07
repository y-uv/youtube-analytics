"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import YouTubeHistory from "@/components/youtube-history";

export default function YouTubeDataPage() {
  const { data: session, status } = useSession();
  const [isDebugVisible, setIsDebugVisible] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold">YouTube Data Explorer</h1>
          <p className="text-gray-500 mt-1">View and analyze your YouTube data</p>
        </div>

        <div className="mt-4 md:mt-0">
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
      </header>

      {status === "authenticated" ? (
        <>
          <p className="mb-4 bg-yellow-50 p-4 border-l-4 border-yellow-500 text-sm">
            <strong>Note:</strong> Open your browser console (F12 &gt; Console tab) to see detailed API responses and debug information.
          </p>
          <YouTubeHistory />
        </>
      ) : status === "unauthenticated" ? (
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