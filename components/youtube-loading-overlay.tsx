"use client"

import React, { useState, useEffect } from 'react'
import { Youtube } from "lucide-react"

// Use Simpsons movie GIF as the primary loading animation
const SIMPSONS_GIF = "/images/simpsons-movie.gif";

// Array of backup loading GIFs if the main one fails to load
const BACKUP_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDBmbHh0bzcyNXdoejc4ZXUyenpqdzhja2tmZ3I1cjQyejE3ZGR3eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7bu3XilJ5BOiSGic/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTY0aXdzbzk5a2lkNzgzajFqNHJhNGRvdmxidTloaTNxajh1dzFxbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hL9q5k9dk9l0k/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXlheXI3NW8za2xzYTRvdGxmYnQwNGFobXpvYnNpbjdvcmE3eXNyeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWJodjY0cnM5aXcyZHFneGFveWh2ejA4ejA4eGVoZjh6bmhleG9xbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlBO7eyXzSZkJri/giphy.gif"
];

// YouTube video title
const VIDEO_TITLE = "The Simpsons Predict Your YouTube History (And They're Right!)";

// YouTube channel names with Simpsons theme
const CHANNEL_NAME = "Youtube Analytics";

// Loading process titles
const LOADING_TITLES = [
  "Your Watch History Insights Are Loading...",
  "Analyzing Your Viewing Habits...",
  "Crunching the Numbers...",
  "Discovering Your YouTube Patterns..."
];

// Format number with commas and abbreviations like YouTube does
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Generate a random number between min and max
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function YouTubeLoadingOverlay() {
  // Use fixed values initially to prevent hydration errors
  const [loadingGif, setLoadingGif] = useState(SIMPSONS_GIF);
  const [videoTitle, setVideoTitle] = useState(VIDEO_TITLE);
  const [channelName, setChannelName] = useState(CHANNEL_NAME);
  const [viewCount, setViewCount] = useState(845800); // Fixed value to prevent hydration errors
  const [likeCount, setLikeCount] = useState(42300); // Fixed value to prevent hydration errors
  const [publishDate, setPublishDate] = useState("May 10, 2025");
  const [loadingTitle, setLoadingTitle] = useState(LOADING_TITLES[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(230500); // Fixed value to prevent hydration errors
    // Flag to track client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Simulate progress increasing over time and apply client-side randomization
  useEffect(() => {
    // Only run this effect on the client side after initial hydration
    if (!isClient) return;
    
    // Select random elements to create a YouTube-like experience
    const randomTitleIndex = Math.floor(Math.random() * LOADING_TITLES.length);
    
    // Always use Simpsons GIF
    setLoadingGif(SIMPSONS_GIF);
    setVideoTitle(VIDEO_TITLE);
    setChannelName(CHANNEL_NAME);
    setLoadingTitle(LOADING_TITLES[randomTitleIndex]);
    
    // Now that we're on client-side, we can safely set random values
    setViewCount(randomInRange(100000, 5000000));
    setLikeCount(randomInRange(5000, 200000));
    setSubscriberCount(randomInRange(50000, 2000000));
    
    // Simulate progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        // Slow down as we approach 100%
        const increment = Math.max(0.5, (100 - prev) / 20);
        const newProgress = prev + increment;
        return newProgress >= 99 ? 99 : newProgress; // Never quite reach 100% until done
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, [isClient]);  return (    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-hidden">
      {/* YouTube-style player container */}
      <div className="w-full max-w-3xl bg-zinc-900 rounded-lg overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: "600px" }}>
        {/* Video player area with optimized loading gif */}
        <div className="bg-black flex items-center justify-center relative" style={{ height: "280px", maxHeight: "280px" }}>          
          {/* Loading GIF in the center of the player - optimized to fit properly */}          
          <img 
            src={loadingGif}
            alt="Loading animation" 
            className="w-full h-full object-contain animate-half-speed"
            style={{ 
              animationPlayState: 'running', 
              // Apply CSS animation to slow down the GIF (half speed)
              animationTimingFunction: 'steps(20, end)',
              animationDuration: '4s'
            }}
            onError={(e) => {
              // If Simpsons GIF fails, try one of the backup GIFs
              e.currentTarget.onerror = null;
              const randomBackup = BACKUP_GIFS[Math.floor(Math.random() * BACKUP_GIFS.length)];
              e.currentTarget.src = randomBackup;
            }}
          />            {/* YouTube-style loading bar at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-700">
            <div 
              className="h-full bg-red-600 transition-all duration-700 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>          </div>
            {/* No buffering indicator - removed as requested */}
        </div>
          {/* Video information section */}
        <div className="p-4 overflow-hidden" style={{ maxHeight: "none" }}>
          {/* Video title */}
          <h2 className="text-lg font-semibold text-white mb-2">{videoTitle}</h2>
          
          {/* Video stats */}
          <div className="flex items-center text-zinc-400 text-sm mb-4">
            <span>{formatNumber(viewCount)} views</span>
            <span className="mx-1">•</span>
            <span>{publishDate}</span>
          </div>

          {/* Engagement buttons */}
          <div className="flex items-center justify-between border-b border-t border-zinc-800 py-2 mb-4">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-zinc-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"></path>
                </svg>
                <span>{formatNumber(likeCount)}</span>
              </button>
              <button className="flex items-center gap-1 text-zinc-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z"></path>
                </svg>
                <span>DISLIKE</span>
              </button>
              <button className="flex items-center gap-1 text-zinc-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15,5.63L20.66,12L15,18.37V15v-1h-1c-3.96,0-7.14,1-9.75,3.09c1.84-4.07,5.11-6.4,9.89-7.1L15,9.86V9V5.63 M14,3v6 c-3.94,0.49-7,2.25-9,5c0,0,3.03-1,9-1h1v3l8-8L14,3L14,3z"></path>
                </svg>
                <span>SHARE</span>
              </button>
            </div>
            <button className="flex items-center gap-1 text-zinc-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22,13h-4v4h-2v-4h-4v-2h4V7h2v4h4V13z M14,7H2v1h12V7z M2,12h8v-1H2V12z M2,16h8v-1H2V16z"></path>
              </svg>
              <span>SAVE</span>
            </button>
          </div>

          {/* Channel info */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                {channelName[0]}
              </div>
              <div>
                <h3 className="text-white font-medium">{channelName}</h3>
                <p className="text-zinc-400 text-sm">{formatNumber(subscriberCount)} subscribers</p>
              </div>
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              SUBSCRIBE
            </button>          </div>          {/* Processing message card removed as requested */}
        </div>
      </div>
    </div>
  )
}
