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
    }
  }, []);

  // Generate all watch history analytics data
  const generateWatchHistoryAnalytics = (data: WatchHistoryItem[]) => {
    try {
      // Process word cloud data
      const words = generateWordCloudData(data);
      setWordCloudData(words);
      
      // Process monthly watch data
      const monthlyData = generateMonthlyWatchData(data);
      setMonthlyWatchData(monthlyData);
      
      // Process hourly watch data
      const hourlyData = generateHourlyWatchData(data);
      setHourlyWatchData(hourlyData);
      
      // Process channel data
      const channels = generateTopChannelsData(data);
      setChannelData(channels);
    } catch (error) {
      console.error("Error generating watch history analytics:", error);
    }
  };

  // Generate word cloud data from video titles
  const generateWordCloudData = (data: WatchHistoryItem[]) => {
    const wordFrequency: Record<string, number> = {};
    const stopWords = new Set([
      "a", "about", "an", "and", "are", "as", "at", "be", "by", "com", "for", 
      "from", "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", 
      "to", "was", "what", "when", "where", "who", "will", "with", "the", "www", 
      "https", "youtube", "video", "watch", "new", "vs"
    ]);
    
    data.forEach(item => {
      if (item.title) {
        const words = item.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/); // Split by whitespace
        
        words.forEach(word => {
          if (word.length > 2 && !stopWords.has(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          }
        });
      }
    });
    
    // Convert to array and sort by frequency
    return Object.entries(wordFrequency)
      .filter(([_, count]) => count > 3) // Filter out rare words
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
    const hourCounts = new Array(24).fill(0).map((_, index) => ({ 
      hour: index, 
      count: 0,
      name: `${index}:00` 
    }));
    
    data.forEach(item => {
      if (item.time) {
        const date = new Date(item.time);
        const hour = date.getHours();
        hourCounts[hour].count += 1;
      }
    });
    
    return hourCounts;
  };

  // Generate top channels data
  const generateTopChannelsData = (data: WatchHistoryItem[]) => {
    const channelMap = new Map();
    
    data.forEach(item => {
      if (item.subtitles && item.subtitles.length > 0) {
        const channelName = item.subtitles[0].name;
        
        if (!channelMap.has(channelName)) {
          channelMap.set(channelName, { name: channelName, count: 0 });
        }
        
        const channelData = channelMap.get(channelName);
        channelData.count += 1;
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
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading Watch History Analytics...</p>
      </div>
    );
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
          </FadeIn>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-6" />
            <h3 className="text-xl font-medium mb-2">Processing Watch History</h3>
            <p className="text-muted-foreground">
              This may take a moment for large files...
            </p>
          </div>
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
                    <CardTitle className="text-xs font-medium text-white">Watch History Period</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/20">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        {monthlyWatchData.length > 0 ? 
                          `${monthlyWatchData[0].name} - ${monthlyWatchData[monthlyWatchData.length - 1].name}` : 
                          "No data"}
                      </p>
                      <p className="text-xs text-blue-300">Watch history time period</p>
                    </div>
                  </CardContent>
                </Card>
              </SlideIn>
            </div>

            <Tabs defaultValue="overview" className="mb-3" onValueChange={setActiveTab}>
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-4 h-8">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="channels" className="text-xs">Top Channels</TabsTrigger>
                <TabsTrigger value="time" className="text-xs">Time Analysis</TabsTrigger>
                <TabsTrigger value="keywords" className="text-xs">Keywords</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <SlideIn from="left" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Monthly Watch Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="p-1 h-[320px] flex items-center justify-center">
                        <ChartContainer minHeight={280}>
                          <AreaChart
                            data={monthlyWatchData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
                          >
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
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
                            />
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [
                                <span style={{ color: "#FFFFFF" }}>{value}</span>,
                                <span style={{ color: "#FFD700" }}>Videos Watched</span>
                              ]}
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
                      </CardHeader>
                      <CardContent className="p-1 h-[320px] flex items-center justify-center">
                        <ChartContainer minHeight={280}>
                          <BarChart
                            data={hourlyWatchData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                            barSize={12}
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
                              formatter={(value) => [
                                <span style={{ color: "#FFFFFF" }}>{value}</span>,
                                <span style={{ color: "#FF5252" }}>Videos Watched</span>
                              ]}
                            />
                            <Bar 
                              dataKey="count" 
                              fill={CHART_COLORS.secondary} 
                              name="Videos Watched" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>
                </div>
              </TabsContent>

              <TabsContent value="channels">
                <SlideIn from="left" delay={0.4} duration={0.5}>
                  <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                    <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                      <CardTitle className="text-xs font-medium text-white">Top 15 Channels</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 h-[380px] flex items-center justify-center">
                      <ChartContainer minHeight={370}>
                        <BarChart
                          data={channelData.slice(0, 15)}
                          margin={{ top: 5, right: 25, left: 130, bottom: 5 }}
                          layout="vertical"
                          barSize={12}
                          barGap={2}
                        >
                          <XAxis
                            type="number"
                            tick={{ fontSize: 9, fill: "#FFFFFF" }}
                            stroke="#FFFFFF"
                            tickFormatter={formatNumber}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 8, fill: "#FFFFFF" }}
                            stroke="#FFFFFF"
                            width={120}
                          />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            formatter={(value, name) => {
                              return [
                                <span style={{ color: "#FFFFFF" }}>{value}</span>,
                                <span style={{ color: "#FF5252" }}>Videos Watched</span>
                              ];
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            name="Videos Watched" 
                            radius={[0, 4, 4, 0]} 
                          >
                            {channelData.slice(0, 15).map((entry, index) => {
                              // Create a gradient from red to blue based on rank
                              const ratio = index / 14; // 0-14 indexes for 15 items
                              // Interpolate between red and blue
                              const r = Math.round(255 * (1 - ratio));
                              const b = Math.round(255 * ratio);
                              const color = `rgb(${r}, 82, ${b})`;
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </SlideIn>
              </TabsContent>

              <TabsContent value="time">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <SlideIn from="left" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Hourly Watching Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="p-1 h-[320px] flex items-center justify-center">
                        <ChartContainer minHeight={280}>
                          <BarChart
                            data={hourlyWatchData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                            barSize={12}
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
                              formatter={(value, name, props) => {
                                const hour = parseInt(props.payload.name);
                                // Use the smooth color transition function
                                const color = getHourColor(hour);
                                return [
                                  <span style={{ color: "#FFFFFF" }}>{value}</span>,
                                  <span style={{ color: color }}>Videos Watched</span>
                                ];
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Videos Watched"
                              radius={[4, 4, 0, 0]}
                            >
                              {hourlyWatchData.map((entry, index) => {
                                // Use the smooth color transition function
                                return <Cell key={`cell-${index}`} fill={getHourColor(index)} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>

                  <SlideIn from="right" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-2 px-3 flex flex-row justify-between items-center">
                        <CardTitle className="text-xs font-medium text-white">Day vs Night Watching</CardTitle>
                      </CardHeader>
                      <CardContent className="p-1 h-[320px] flex items-center justify-center">
                        <ChartContainer minHeight={280}>
                          <div className="relative">
                            <PieChart width={350} height={280}>
                              <Pie
                                data={[
                                  { 
                                    name: "Daytime (7AM-7PM)", 
                                    value: hourlyWatchData.slice(7, 20).reduce((sum, hour) => sum + hour.count, 0) 
                                  },
                                  { 
                                    name: "Nighttime (7PM-7AM)", 
                                    value: hourlyWatchData.slice(0, 7).concat(hourlyWatchData.slice(20)).reduce((sum, hour) => sum + hour.count, 0) 
                                  }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#FFD700" />
                                <Cell fill="#2196F3" />
                              </Pie>
                              <Tooltip
                                contentStyle={tooltipContentStyle}
                                formatter={(value, name) => {
                                  // Convert name to string to safely use includes() method
                                  const nameStr = String(name);
                                  const color = nameStr.includes("Daytime") ? "#FFD700" : "#2196F3";
                                  return [
                                    <span style={{ color: "#FFFFFF" }}>{value}</span>,
                                    <span style={{ color }}>{nameStr}</span>
                                  ];
                                }}
                              />
                            </PieChart>
                            {/* Positioned Sun icon */}
                            <div className="absolute text-white" style={{ top: '35%', left: '30%', transform: 'translate(-50%, -50%)' }}>
                              <Sun className="h-6 w-6 text-yellow-400" />
                            </div>
                            {/* Positioned Moon icon */}
                            <div className="absolute text-white" style={{ top: '35%', left: '70%', transform: 'translate(-50%, -50%)' }}>
                              <Moon className="h-6 w-6 text-blue-400" />
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <div className="flex items-center gap-1">
                              <Sun className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs text-yellow-500">Day</span>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <Moon className="h-4 w-4 text-blue-500" />
                              <span className="text-xs text-blue-500">Night</span>
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
                            className="inline-block px-2 py-1 rounded" 
                            style={{
                              fontSize: `${Math.max(0.8, Math.min(3, 0.8 + (word.value / wordCloudData[0].value) * 2))}rem`,
                              color: [
                                "#FFD700", // Yellow
                                "#FF5252", // Red
                                "#4CAF50", // Green
                                "#2196F3", // Blue
                                "#E040FB", // Purple
                              ][index % 5],
                              opacity: 0.7 + (word.value / wordCloudData[0].value) * 0.3,
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