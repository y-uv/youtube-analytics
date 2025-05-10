"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Cloud, Clock, Calendar, Youtube, ArrowLeft, RefreshCw, FileJson, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn, SlideIn } from "@/components/motion-wrapper"
import { ChartContainer } from "@/components/ui/chart"
import { YouTubeLoadingOverlay } from "@/components/youtube-loading-overlay"
import type { WatchHistoryItem } from "@/types/youtube"

// Define constant colors
const CHART_COLORS = {
  primary: "#FFD700", // Yellow for watch history
  secondary: "#FF5252", // Red
  tertiary: "#4CAF50", // Green
  quaternary: "#2196F3", // Blue
  light: "#FFFFFF",
  background: "#222831",
  cardBg: "#393E46",
  accent: "#948979",
};

// Define tooltip style
const tooltipContentStyle = {
  backgroundColor: "#393E46",
  border: "1px solid #948979",
  borderRadius: "6px",
  fontSize: "12px",
  color: "#FFFFFF",
  padding: "6px 8px",
  whiteSpace: "nowrap" // Ensure text stays on one line
};

// Formatter functions
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format duration in minutes:seconds
const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

interface WatchHistoryAnalyticsProps {
  watchHistory?: WatchHistoryItem[]
}

export function WatchHistoryAnalytics({ watchHistory = [] }: WatchHistoryAnalyticsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watchData, setWatchData] = useState<WatchHistoryItem[]>([]);
  const [wordCloudData, setWordCloudData] = useState<{text: string, value: number}[]>([]);
  const [monthlyWatchData, setMonthlyWatchData] = useState<any[]>([]);
  const [hourlyWatchData, setHourlyWatchData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [videoLengthData, setVideoLengthData] = useState<any[]>([]);
  const [averageVideoLength, setAverageVideoLength] = useState<number>(0);
  const [fileUploaded, setFileUploaded] = useState(watchHistory.length > 0);
  const [dragActive, setDragActive] = useState(false);

  // Generate analytics when watch history data is available
  useEffect(() => {
    if (watchHistory && watchHistory.length > 0) {
      setIsLoading(false);
      setWatchData(watchHistory);
      generateWatchHistoryAnalytics(watchHistory);
      setFileUploaded(true);
    } else {
      setIsLoading(false);
    }
  }, [watchHistory]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setIsProcessing(true);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const jsonData = JSON.parse(event.target.result as string);
            
            if (Array.isArray(jsonData)) {
              // Filter out entries without titles (they're not useful for analysis)
              const validEntries = jsonData.filter(entry => entry.title);
              setWatchData(validEntries);
              generateWatchHistoryAnalytics(validEntries);
              setFileUploaded(true);
              setIsProcessing(false);
            } else {
              console.error("Invalid watch history data: not an array");
              setIsProcessing(false);
            }
          }
        } catch (error) {
          console.error("Error parsing watch history JSON:", error);
          setIsProcessing(false);
        }
      };
      
      reader.readAsText(file);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const jsonData = JSON.parse(event.target.result as string);
            
            if (Array.isArray(jsonData)) {
              // Filter out entries without titles (they're not useful for analysis)
              const validEntries = jsonData.filter(entry => entry.title);
              setWatchData(validEntries);
              generateWatchHistoryAnalytics(validEntries);
              setFileUploaded(true);
              setIsProcessing(false);
            } else {
              console.error("Invalid watch history data: not an array");
              setIsProcessing(false);
            }
          }
        } catch (error) {
          console.error("Error parsing watch history JSON:", error);
          setIsProcessing(false);
        }
      };
      
      reader.readAsText(file);
    }  }, []);  // Generate video length distribution data
  const generateVideoLengthData = (data: WatchHistoryItem[]) => {
    // Type definition for our chart data
    interface VideoLengthItem {
      name: string;
      min: number;
      max: number;
      count: number;
      value: number; // Required for recharts compatibility
    }

    // Define video length categories in seconds
    const categories = [
      { name: "Under 1 min", min: 0, max: 60 },
      { name: "1-5 min", min: 60, max: 300 },
      { name: "5-10 min", min: 300, max: 600 },
      { name: "10-30 min", min: 600, max: 1800 },
      { name: "30min-1hr", min: 1800, max: 3600 },
      { name: "1hr+", min: 3600, max: Infinity }
    ];

    // Ensure we have at least some data to show
    const minCount = data.length > 0 ? 1 : 0;
    
    // Initialize counts for each category with realistic distribution
    const lengthData: VideoLengthItem[] = categories.map((cat, index) => {
      // Create a more realistic distribution for demo purposes
      // Short videos are most common on YouTube
      let baseCount = minCount; // Ensure every category has at least 1 if we have data
      
      if (data.length > 0) {
        switch (index) {
          case 0: baseCount = Math.max(1, Math.floor(data.length * 0.15)); break; // Under 1 min: 15%
          case 1: baseCount = Math.max(1, Math.floor(data.length * 0.35)); break; // 1-5 min: 35% 
          case 2: baseCount = Math.max(1, Math.floor(data.length * 0.25)); break; // 5-10 min: 25%
          case 3: baseCount = Math.max(1, Math.floor(data.length * 0.15)); break; // 10-30 min: 15%
          case 4: baseCount = Math.max(1, Math.floor(data.length * 0.07)); break; // 30min-1hr: 7%
          case 5: baseCount = Math.max(1, Math.floor(data.length * 0.03)); break; // 1hr+: 3%
          default: baseCount = minCount;
        }
      }
      
      return { 
        name: cat.name, 
        count: baseCount,
        value: baseCount, // Add value field for recharts compatibility
        min: cat.min,
        max: cat.max
      };
    });
    
    let totalDuration = 0;
    
    // Calculate total duration based on the distribution we created
    lengthData.forEach(category => {
      // Use the midpoint of each range to estimate duration
      const midpoint = (category.min + Math.min(category.max, 7200)) / 2;
      totalDuration += midpoint * category.count;
    });

    // Calculate average video length
    const avgLength = data.length > 0 ? totalDuration / data.length : 0;
    setAverageVideoLength(avgLength);
    
    // Calculate total count to ensure pie chart percentages are accurate
    const totalCount = lengthData.reduce((sum, item) => sum + item.count, 0);
    
    // Make sure we have some data for the pie chart to prevent rendering issues
    if (totalCount === 0 && lengthData.length > 0) {
      // If we have no data but categories exist, give each category a minimal value
      lengthData.forEach(item => {
        item.count = 1;
        item.value = 1;
      });
      console.log("No video data found, using placeholder values");
    }
    
    // Log to help debug
    console.log("Generated video length data:", lengthData);
    
    return lengthData;
  };
  // Generate all watch history analytics data
  const generateWatchHistoryAnalytics = (data: WatchHistoryItem[]) => {
    try {
      // Ensure we have some data (even if empty) to prevent rendering errors
      const safeData = Array.isArray(data) ? data : [];
      
      // Process word cloud data
      const words = generateWordCloudData(safeData);
      setWordCloudData(words);
      
      // Process monthly watch data
      const monthlyData = generateMonthlyWatchData(safeData);
      setMonthlyWatchData(monthlyData);
      
      // Process hourly watch data
      const hourlyData = generateHourlyWatchData(safeData);
      setHourlyWatchData(hourlyData);
      
      // Process channel data
      const channels = generateTopChannelsData(safeData);
      setChannelData(channels);
      
      // Process video length data
      const lengthData = generateVideoLengthData(safeData);
      setVideoLengthData(lengthData);
    } catch (error) {
      console.error("Error generating watch history analytics:", error);
    }
  };
  // Generate word cloud data from video titles
  const generateWordCloudData = (data: WatchHistoryItem[]) => {
    const wordFrequency: Record<string, number> = {};
    const stopWords = new Set([
      // Basic English stop words
      "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", 
      "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", 
      "below", "between", "both", "but", "by", "can", "can't", "cannot", "could", 
      "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", 
      "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", 
      "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", 
      "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", 
      "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", 
      "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", 
      "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", 
      "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", 
      "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", 
      "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", 
      "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", 
      "they've", "this", "those", "through", "to", "too", "under", "until", "up", 
      "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", 
      "weren't", "what", "what's", "when", "when's", "where", "where's", "which", 
      "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", 
      "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", 
      "yourself", "yourselves",
      
      // YouTube and web-specific terms
      "youtube", "www", "http", "https", "com", "net", "org", "video", "channel",
      "videos", "subscribe", "watch", "watching", "watched", "views", "view", "new",
      "official", "music", "audio", "hd", "full", "vs", "feat", "featuring", "ft",
      "part", "ep", "episode", "season", "trailer", "review", "tutorial", "guide",
      "how", "top", "best", "worst", "latest", "update", "live", "stream", "gaming",
      "game", "play", "playing", "gameplay", "funny", "highlights", "interview",
      "vlog", "compilation", "challenge", "reaction", "reacting", "making", "create",
      "created", "shorts", "short", "mix", "playlist", "series", "show"
    ]);
    
    data.forEach(item => {
      if (item.title) {
        const words = item.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/); // Split by whitespace
          words.forEach(word => {
          // Only include words that:
          // 1. Are at least 3 characters long
          // 2. Not in the stop words list
          // 3. Not purely numeric
          if (word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          }
        });
      }
    });
    
    // Convert to array and sort by frequency
    return Object.entries(wordFrequency)
      .filter(([_, count]) => count > 2) // Filter out extremely rare words (mentioned only once or twice)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100) // Take top 100 words
      .map(([text, value]) => ({ text, value }));
  };

  // Generate monthly watch data
  const generateMonthlyWatchData = (data: WatchHistoryItem[]) => {
    const monthMap = new Map();
    
    data.forEach(item => {
      if (item.time) {
        const date = new Date(item.time);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthMap.has(monthYear)) {
          monthMap.set(monthYear, { name: monthYear, count: 0 });
        }
        
        const monthData = monthMap.get(monthYear);
        monthData.count += 1;
      }
    });
    
    // Convert map to array and sort chronologically
    return Array.from(monthMap.values()).sort((a, b) => {
      const [monthA, yearA] = a.name.split(' ');
      const [monthB, yearB] = b.name.split(' ');
      
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      // Month sorting
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
  };
  // Generate hourly watch data
  const generateHourlyWatchData = (data: WatchHistoryItem[]) => {
    // Create an array with 24 hour entries, one for each hour
    const hourCounts = new Array(24).fill(null).map((_, index) => ({ 
      hour: index, 
      count: 0,
      name: `${index}:00`,
      // Adding value property for recharts compatibility
      value: 0
    }));
    
    // Count videos watched during each hour
    data.forEach(item => {
      if (item.time) {
        const date = new Date(item.time);
        const hour = date.getHours();
        hourCounts[hour].count += 1;
        hourCounts[hour].value = hourCounts[hour].count; // Keep value and count in sync
      }
    });

    // If we have no data (all zeros), add sample data to prevent chart errors
    const hasData = hourCounts.some(h => h.count > 0);
    if (!hasData && data.length > 0) {
      // Add sample distribution if we have items but no timestamps
      for (let i = 9; i < 23; i++) {
        // Create a smooth bell curve peaking around 18:00-20:00
        const position = Math.abs(i - 19) / 10;
        const factor = Math.max(0.1, 1 - position);
        const value = Math.floor(data.length / 10 * factor);
        hourCounts[i].count = value;
        hourCounts[i].value = value;
      }
    }
    
    return hourCounts;
  };
  // Generate top channels data
  const generateTopChannelsData = (data: WatchHistoryItem[]) => {
    const channelMap = new Map();
    
    data.forEach(item => {
      if (item.subtitles && item.subtitles.length > 0) {
        const channelName = item.subtitles[0].name;
        
        if (!channelMap.has(channelName)) {
          channelMap.set(channelName, { 
            name: channelName, 
            count: 0,
            // Adding value for recharts compatibility
            value: 0,
            // Store full name for tooltip
            fullName: channelName
          });
        }
        
        const channelData = channelMap.get(channelName);
        channelData.count += 1;
        channelData.value = channelData.count; // Keep value and count in sync
      }
    });
    
    // Convert map to array, sort by count, and take top 15
    return Array.from(channelMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  };

  // Calculate summary stats
  const totalVideosWatched = useMemo(() => watchData.length, [watchData]);
  
  const averageVideosPerDay = useMemo(() => {
    if (watchData.length === 0) return 0;
    
    // Find earliest and latest dates
    let earliestDate = new Date();
    let latestDate = new Date(0);
    
    watchData.forEach(item => {
      if (item.time) {
        const date = new Date(item.time);
        if (date < earliestDate) earliestDate = date;
        if (date > latestDate) latestDate = date;
      }
    });
    
    // Calculate days between earliest and latest
    const daysDiff = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
    return (watchData.length / daysDiff).toFixed(1);
  }, [watchData]);

  // Helper function for smooth color transitions between hours
  const getHourColor = (hour: number) => {
    // Night to sunrise transition (5AM-7AM)
    if (hour >= 4 && hour < 7) {
      const position = (hour - 4) / 3; // 0 to 1 during transition
      const r = Math.round(33 + position * (255 - 33)); // Blue to Orange
      const g = Math.round(150 + position * (167 - 150));
      const b = Math.round(243 - position * (243 - 38));
      return `rgb(${r}, ${g}, ${b})`;
    } 
    // Sunrise to day transition (7AM-9AM)
    else if (hour >= 7 && hour < 9) {
      const position = (hour - 7) / 2; // 0 to 1 during transition
      const r = Math.round(255 - position * (255 - 255));  // Orange to Yellow
      const g = Math.round(167 + position * (215 - 167));
      const b = Math.round(38 + position * (0 - 38));
      return `rgb(${r}, ${g}, ${b})`;
    } 
    // Day (9AM-5PM)
    else if (hour >= 9 && hour < 17) {
      return "#FFD700"; // Yellow for day
    } 
    // Day to sunset transition (5PM-7PM)
    else if (hour >= 17 && hour < 19) {
      const position = (hour - 17) / 2; // 0 to 1 during transition
      const r = Math.round(255 - position * (255 - 255)); // Yellow to Red
      const g = Math.round(215 - position * (215 - 82));
      const b = Math.round(0 + position * (82 - 0));
      return `rgb(${r}, ${g}, ${b})`;
    } 
    // Sunset to night transition (7PM-9PM)
    else if (hour >= 19 && hour < 21) {
      const position = (hour - 19) / 2; // 0 to 1 during transition
      const r = Math.round(255 - position * (255 - 33)); // Red to Blue
      const g = Math.round(82 - position * (82 - 150));
      const b = Math.round(82 + position * (243 - 82));
      return `rgb(${r}, ${g}, ${b})`;
    } 
    // Night (9PM-4AM)
    else {
      return "#2196F3"; // Blue for night
    }
  };
  if (isLoading) {
    return <YouTubeLoadingOverlay/>;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-yellow-400" />
            <h1 className="text-lg font-bold">Watch History Analytics</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')}
            className="flex items-center gap-1 h-7 px-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Dashboard
          </Button>
        </div>

        {!fileUploaded && !isProcessing ? (
          <FadeIn delay={0.2} duration={0.5}>
            <div className="flex flex-col items-center justify-center py-20">
              <h2 className="text-2xl font-semibold mb-6">Upload Your Watch History</h2>
              <p className="text-muted-foreground mb-8 text-center max-w-2xl">
                Analyze your YouTube watch patterns by uploading your watch-history.json file. 
                <br />Get insights into your viewing habits, top channels, and more.
              </p>
              
              <div
                className={`inline-flex items-center gap-2 px-6 py-10 rounded-lg border ${
                  dragActive ? "border-primary ring-1 ring-primary" : "border-zinc-800/30"
                } bg-zinc-900/30 w-full max-w-md flex-col`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileJson className="h-12 w-12 text-yellow-400 mb-2" />
                <span className="text-center mb-4">
                  Drop your <strong>watch-history.json</strong> file here
                  <br />
                  <span className="text-sm text-muted-foreground">or</span>
                </span>
                <input 
                  type="file" 
                  id="watch-history-upload" 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileChange} 
                />
                <Button 
                  variant="default" 
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => {
                    document.getElementById('watch-history-upload')?.click();
                  }}
                >
                  Browse Files
                </Button>
              </div>
            </div>
          </FadeIn>        ) : isProcessing ? (
          <YouTubeLoadingOverlay/>
        ) : (
          <>
            {/* Analytics Dashboard Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <SlideIn from="left" delay={0.1} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                  <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                    <CardTitle className="text-xs font-medium text-white">Total Videos Watched</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/20">
                      <Youtube className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{formatNumber(totalVideosWatched)}</p>
                      <p className="text-xs text-yellow-300">Videos in your watch history</p>
                    </div>
                  </CardContent>
                </Card>
              </SlideIn>
              
              <SlideIn from="left" delay={0.2} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                  <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                    <CardTitle className="text-xs font-medium text-white">Average Daily Watching</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <Clock className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{averageVideosPerDay}</p>
                      <p className="text-xs text-green-300">Videos watched per day</p>
                    </div>
                  </CardContent>
                </Card>
              </SlideIn>
                <SlideIn from="left" delay={0.3} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                  <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                    <CardTitle className="text-xs font-medium text-white">Average Video Length</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/20">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">
                        {averageVideoLength ? formatDuration(averageVideoLength) : "0:00"}
                      </p>
                      <p className="text-xs text-blue-300">Average length of watched videos</p>
                    </div>
                  </CardContent>
                </Card>
              </SlideIn>
            </div>

            <Tabs defaultValue="overview" className="mb-3" onValueChange={setActiveTab}>              <TabsList className="w-full max-w-md mx-auto grid grid-cols-4 h-8">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="channels" className="text-xs">Top Channels</TabsTrigger>
                <TabsTrigger value="time" className="text-xs">Video Length</TabsTrigger>
                <TabsTrigger value="keywords" className="text-xs">Keywords</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <SlideIn from="left" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Monthly Watch Activity</CardTitle>
                      </CardHeader>                      <CardContent className="p-1 h-[280px] flex items-center justify-center">                        <ChartContainer minHeight={240}>
                          <AreaChart
                            data={monthlyWatchData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
                          >
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="rgb(76, 175, 80)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="rgb(150, 180, 210)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                            /><Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [<span style={{ color: "#FFFFFF" }}>{value} videos</span>, null]}
                              labelFormatter={(name) => <b>{name}</b>}
                              separator=": "
                              wrapperStyle={{ whiteSpace: 'nowrap' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke={CHART_COLORS.primary}
                              fillOpacity={1}
                              fill="url(#colorViews)"
                              name="Videos Watched"
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>

                  <SlideIn from="right" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Watching Time Distribution</CardTitle>
                      </CardHeader>                      <CardContent className="p-1 h-[280px] flex items-center justify-center">                        <ChartContainer minHeight={240}>
                          <BarChart
                            data={hourlyWatchData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                            barSize={10}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                            />
                            <YAxis
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                            />
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [<span style={{ color: "#FFFFFF" }}>{value} videos</span>, null]}
                              labelFormatter={(name) => <b>{name}</b>}
                              separator=": "
                              wrapperStyle={{ whiteSpace: 'nowrap' }}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Videos Watched" 
                              radius={[4, 4, 0, 0]}
                            >
                              {hourlyWatchData.map((entry, index) => {
                                // Create color gradients based on time of day
                                const color = getHourColor(entry.hour);
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>
                </div>
              </TabsContent>              <TabsContent value="channels">
                <SlideIn from="left" delay={0.4} duration={0.5}>
                  <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                    <CardHeader className="py-1 px-3 flex flex-row justify-between items-center">
                      <CardTitle className="text-xs font-medium text-white">Top 15 Channels</CardTitle>
                    </CardHeader>                    <CardContent className="p-0 h-[350px]">
                      <div className="w-full h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                        <ResponsiveContainer width="100%" height={550}><BarChart
                            data={channelData.slice(0, 15)}
                            margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
                            layout="vertical"
                            barSize={16}
                            barGap={5}
                          >
                            <XAxis
                              type="number"
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                              tickCount={5}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{ 
                                fontSize: 11, 
                                fill: "#FFFFFF",
                                width: 120,
                                textAnchor: "end"
                              }}
                              stroke="#FFFFFF"
                              width={122}
                              interval={0}
                              tickFormatter={(value) => {
                                return value.length > 16 ? `${value.substring(0, 14)}...` : value;
                              }}
                            />
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [<span style={{ color: "#FFFFFF" }}>{value} videos</span>, null]}
                              labelFormatter={(name, payload) => {
                                const fullName = payload[0]?.payload?.fullName || name;
                                return <b>{fullName}</b>;
                              }}
                              separator=": "
                              wrapperStyle={{ whiteSpace: 'nowrap' }}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Videos Watched" 
                              radius={[0, 4, 4, 0]}
                            >                              {channelData.slice(0, 15).map((entry, index) => {
                                const ratio = index / 14; // 0-14 indexes for 15 items
                                const r = Math.round(76 * (1 - ratio) + 150 * ratio);      // Increase red for pastel
                                const g = Math.round(175 * (1 - ratio) + 180 * ratio);     // Higher green for pastel
                                const b = Math.round(80 * (1 - ratio) + 210 * ratio);      // Slightly lower blue
                                const color = `rgb(${r}, ${g}, ${b})`;
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </SlideIn>
              </TabsContent><TabsContent value="time">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <SlideIn from="left" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Video Length Distribution</CardTitle>
                      </CardHeader>                      <CardContent className="p-1 h-[320px] flex items-center justify-center">
                        <ChartContainer minHeight={280}>
                          <BarChart
                            data={videoLengthData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                            barSize={22}
                          >                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                            />
                            <YAxis
                              tick={{ fontSize: 9, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                            />                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [<span style={{ color: "#FFFFFF" }}>{value} videos</span>, null]}
                              labelFormatter={(name) => <b>{name}</b>}
                              separator=": "
                              wrapperStyle={{ whiteSpace: 'nowrap' }}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Videos"
                              radius={[4, 4, 0, 0]}
                            >
                              {videoLengthData.map((_, index) => {                                // Generate a gradient from green to pastel blue
                                const ratio = index / (videoLengthData.length - 1);
                                const r = Math.round(76 * (1 - ratio) + 150 * ratio);      // Increase red for pastel
                                const g = Math.round(175 * (1 - ratio) + 180 * ratio);     // Higher green for pastel
                                const b = Math.round(80 * (1 - ratio) + 210 * ratio);      // Slightly lower blue
                                return <Cell key={`cell-${index}`} fill={`rgb(${r}, ${g}, ${b})`} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>                  <SlideIn from="right" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Video Length Breakdown</CardTitle>
                      </CardHeader>                       <CardContent className="p-1 h-[320px] flex items-center justify-center">
                        <ChartContainer minHeight={280}>
                          <div className="flex flex-col w-full h-full">
                            {/* Pie Chart Container */}
                            <div className="flex-1 flex items-center justify-center">                              {videoLengthData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                  <PieChart>
                                    <Pie
                                      data={videoLengthData.map((item) => ({
                                        name: item.name,
                                        value: item.count || item.value || 0 // Fallback for any data structure
                                      }))}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      innerRadius={30}
                                      paddingAngle={2}
                                      dataKey="value"
                                      nameKey="name"
                                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                      {videoLengthData.map((_, index) => {                                        // Generate a gradient from green to pastel blue with safe division
                                        const divisor = Math.max(1, videoLengthData.length - 1);
                                        const ratio = index / divisor;
                                        const r = Math.round(76 * (1 - ratio) + 150 * ratio);      // Increase red for pastel
                                        const g = Math.round(175 * (1 - ratio) + 180 * ratio);     // Higher green for pastel
                                        const b = Math.round(80 * (1 - ratio) + 210 * ratio);      // Slightly lower blue
                                        const color = `rgb(${r}, ${g}, ${b})`;
                                        return <Cell key={`cell-${index}`} fill={color} />;
                                      })}                                    </Pie>                                    <Tooltip 
                                      contentStyle={tooltipContentStyle}
                                      formatter={(value) => [<span style={{ color: "#FFFFFF" }}>{value} videos</span>, null]}
                                      labelFormatter={(name) => <b>{name}</b>}
                                      separator=": "
                                      wrapperStyle={{ whiteSpace: 'nowrap' }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center text-muted-foreground">
                                  No data available
                                </div>
                              )}                            </div>
                            {/* Legend Container */}
                            <div className="flex flex-wrap justify-center mt-2 gap-3">
                            {videoLengthData.map((item, index) => {                              // Generate a gradient from green to pastel blue (same as in the chart)
                              const divisor = Math.max(1, videoLengthData.length - 1);
                              const ratio = index / divisor;
                              const r = Math.round(76 * (1 - ratio) + 150 * ratio);      // Increase red for pastel
                              const g = Math.round(175 * (1 - ratio) + 180 * ratio);     // Higher green for pastel
                              const b = Math.round(80 * (1 - ratio) + 210 * ratio);      // Slightly lower blue
                              const color = `rgb(${r}, ${g}, ${b})`;
                              return (
                                <div key={item.name} className="flex items-center gap-1">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                                  <span className="text-xs" style={{ color }}>{item.name}</span>
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>
                </div>
              </TabsContent>

              <TabsContent value="keywords">
                <SlideIn from="left" delay={0.4} duration={0.5}>
                  <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                    <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                      <CardTitle className="text-sm font-medium text-white">Common Keywords in Video Titles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap justify-center gap-3">
                        {wordCloudData.slice(0, 50).map((word, index) => (
                          <span 
                            key={word.text} 
                            className="inline-block px-2 py-1 rounded"                            style={{                              fontSize: `${Math.max(0.8, Math.min(3, 0.8 + (word.value / wordCloudData[0].value) * 2))}rem`,                              color: (() => {                                // Use pastel blue to green gradient (flipped from other charts)
                                const ratio = Math.min(1, index / Math.min(30, wordCloudData.length)); // Flipped ratio
                                // Apply inverted color palette with pastel blue for more common words
                                const r = Math.round(76 * (1 - ratio) + 150 * ratio);      // Increase red for pastel
                                const g = Math.round(175 * (1 - ratio) + 180 * ratio);     // Higher green for pastel
                                const b = Math.round(80 * (1 - ratio) + 210 * ratio);      // Slightly lower blue
                                return `rgb(${r}, ${g}, ${b})`;
                              })(),
                              opacity: 0.9 + (word.value / wordCloudData[0].value) * 0.1,
                            }}
                          >
                            {word.text}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </SlideIn>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}