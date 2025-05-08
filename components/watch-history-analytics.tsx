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
import { Cloud, Clock, Calendar, Youtube, ArrowLeft, RefreshCw, FileJson } from "lucide-react"
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading Watch History Analytics...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-yellow-400" />
            <h1 className="text-xl font-bold">Watch History Analytics</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <SlideIn from="left" delay={0.1} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Total Videos Watched</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                      <Youtube className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{formatNumber(totalVideosWatched)}</p>
                      <p className="text-xs text-yellow-300">Videos in your watch history</p>
                    </div>
                  </CardContent>
                </Card>
              </SlideIn>
              
              <SlideIn from="left" delay={0.2} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Average Daily Watching</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/20">
                      <Clock className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{averageVideosPerDay}</p>
                      <p className="text-xs text-green-300">Videos watched per day</p>
                    </div>
                  </CardContent>
                </Card>
              </SlideIn>
              
              <SlideIn from="left" delay={0.3} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Watch History Period</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">
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

            <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="channels">Top Channels</TabsTrigger>
                <TabsTrigger value="time">Time Analysis</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SlideIn from="left" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-sm font-medium text-white">Monthly Watch Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 h-[400px]">
                        <ChartContainer minHeight={350}>
                          <AreaChart
                            data={monthlyWatchData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                          >
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                            />
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [value, "Videos Watched"]}
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
                      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-sm font-medium text-white">Watching Time Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 h-[400px]">
                        <ChartContainer minHeight={350}>
                          <BarChart
                            data={hourlyWatchData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                            barSize={15}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                            />
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [value, "Videos Watched"]}
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
                    <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                      <CardTitle className="text-sm font-medium text-white">Top 15 Channels</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 h-[500px]">
                      <ChartContainer minHeight={450}>
                        <BarChart
                          data={channelData}
                          margin={{ top: 10, right: 30, left: 150, bottom: 10 }}
                          layout="vertical"
                          barSize={20}
                        >
                          <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: "#FFFFFF" }}
                            stroke="#FFFFFF"
                            tickFormatter={formatNumber}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "#FFFFFF" }}
                            stroke="#FFFFFF"
                            width={140}
                          />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            formatter={(value) => [value, "Videos Watched"]}
                          />
                          <Bar 
                            dataKey="count" 
                            fill={CHART_COLORS.tertiary} 
                            name="Videos Watched" 
                            radius={[0, 4, 4, 0]} 
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </SlideIn>
              </TabsContent>

              <TabsContent value="time">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SlideIn from="left" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-sm font-medium text-white">Hourly Watching Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 h-[400px]">
                        <ChartContainer minHeight={350}>
                          <BarChart
                            data={hourlyWatchData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                            barSize={15}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#FFFFFF" }}
                              stroke="#FFFFFF"
                              tickFormatter={formatNumber}
                            />
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [value, "Videos Watched"]}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Videos Watched"
                              radius={[4, 4, 0, 0]}
                            >
                              {hourlyWatchData.map((entry, index) => {
                                // Create a gradient color based on the hour (night vs day)
                                const isDaytime = index >= 7 && index <= 19;
                                return <Cell key={`cell-${index}`} fill={isDaytime ? "#FFD700" : "#2196F3"} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </SlideIn>

                  <SlideIn from="right" delay={0.4} duration={0.5}>
                    <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg">
                      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-sm font-medium text-white">Day vs Night Watching</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 h-[400px]">
                        <ChartContainer minHeight={350}>
                          <PieChart>
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
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              <Cell fill="#FFD700" />
                              <Cell fill="#2196F3" />
                            </Pie>
                            <Tooltip
                              contentStyle={tooltipContentStyle}
                              formatter={(value) => [value, "Videos Watched"]}
                            />
                          </PieChart>
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