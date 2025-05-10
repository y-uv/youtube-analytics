"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
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
import { FileJson, LogIn, Settings, Youtube, RefreshCw, BarChart3, Moon as MoonIcon, Sun as SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn, SlideIn } from "@/components/motion-wrapper";
import { generateActivityBreakdownData, generateMonthlyActivityData } from "@/lib/analytics-utils"
import { useAllYouTubeData } from "@/hooks/use-youtube-data"
import { ChartContainer } from "@/components/ui/chart"
import type { WatchHistoryItem } from "@/types/youtube"

// Define all the static formatter functions outside the component
// This ensures hook order consistency and prevents recreation on each render
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const tooltipFormatter = (value: number, name: string) => {
  const formattedName = name === "likes" 
    ? "Likes" 
    : name === "playlists" 
    ? "Playlists" 
    : name === "subscriptions"
    ? "Subscriptions"
    : name;
  return [value, formattedName];
};

const legendFormatter = (value: string) => {
  const formattedValue = value === "likes" 
    ? "Likes" 
    : value === "playlists" 
    ? "Playlists" 
    : value === "subscriptions"
    ? "Subscriptions"
    : value;

  // Apply color based on the value
  const color = value === "likes" 
    ? CHART_COLORS.likes 
    : value === "playlists" 
    ? CHART_COLORS.playlists 
    : value === "subscriptions"
    ? CHART_COLORS.subscriptions
    : "#DFD0B8"; // Default to light beige

  return <span className="text-xs" style={{ color }}>{formattedValue}</span>;
};

// Define constant colors with our new color scheme - matching watch-history-analytics.tsx
const CHART_COLORS = {
  primary: "#FFD700",   // Golden for primary charts (matching watch-history-analytics.tsx)
  likes: "#FF5252",     // Red for likes (matching secondary in watch-history)
  playlists: "#4CAF50", // Green for playlists (matching tertiary in watch-history)
  subscriptions: "#2196F3", // Blue for subscriptions (matching quaternary in watch-history)
  total: "#FFFFFF",     // White for total activity
  background: "#222831", // Dark background
  cardBg: "#393E46",    // Dark gray for cards
  accent: "#948979",    // Taupe accent
  light: "#FFFFFF",     // White text
  // Adding indexed properties for array-like access
  0: "#FF5252",     // Red
  1: "#4CAF50",     // Green
  2: "#2196F3",     // Blue
  3: "#FFFFFF",     // White
  length: 4         // Length property for array-like behavior
};

// Define constant styles outside component
const tooltipContentStyle = {
  backgroundColor: "#393E46", // Dark gray background
  border: "1px solid #948979", // Taupe border
  borderRadius: "6px",
  fontSize: "12px",
  color: "#FFFFFF", // White text for tooltips
};

export function Analytics() {
  // React hooks - keep all hook calls at the top level and in a consistent order
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [activePage, setActivePage] = useState("dashboard")
  const [dragActive, setDragActive] = useState(false)
  
  // Use the combined YouTube data hook
  const { 
    likedVideos, 
    playlists, 
    subscriptions, 
    channelStats,
    isLoading, 
    isError, 
    error,
    refetch 
  } = useAllYouTubeData();

  // Activity statistics states
  const [monthlyActivityData, setMonthlyActivityData] = useState<any[]>([])
  const [activityBreakdownData, setActivityBreakdownData] = useState<any[]>([])

  // Memoize event handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // For any files dropped, redirect to the watch history page
      // This simplifies the logic since we're focusing watch history analysis there
      window.location.href = '/watch-history';
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // For any files selected, redirect to the watch history page
      // This simplifies the logic since we're focusing watch history analysis there
      window.location.href = '/watch-history';
    }
  }, []);

  const togglePage = useCallback(() => {
    setActivePage(prev => prev === "dashboard" ? "settings" : "dashboard")
  }, []);

  // Create a stable dependency array for the effect
  const dataSourceArray = useMemo(() => [
    likedVideos.length, 
    playlists.length, 
    subscriptions.length, 
    isLoading, 
    isError
  ], [likedVideos, playlists, subscriptions, isLoading, isError]);

  // Process data whenever the source data changes
  useEffect(() => {
    // Only process data when we have data and we're not loading or in error state
    if (!isLoading && !isError) {
      try {
        // Generate data outside of the state setter to avoid unnecessary renders
        const monthlyData = generateMonthlyActivityData(likedVideos, playlists, subscriptions);
        const breakdownData = generateActivityBreakdownData(likedVideos, playlists, subscriptions);
        
        // Batch the state updates to avoid multiple renders
        setMonthlyActivityData(monthlyData);
        setActivityBreakdownData(breakdownData);
      } catch (err) {
        console.error("Error generating chart data:", err);
      }
    }
  }, dataSourceArray); // Use the stable dependency array

  // Memoize derived data to avoid recalculations on each render
  const totalLikes = useMemo(() => likedVideos.length, [likedVideos]);
  const totalPlaylists = useMemo(() => playlists.length, [playlists]);
  const totalSubscriptions = useMemo(() => subscriptions.length, [subscriptions]);

  // Memoize chart elements to prevent recreating on each render
  const pieChartCells = useMemo(() => {
    return activityBreakdownData.map((entry) => {
      // Use the color property directly from the data
      return <Cell key={entry.name} fill={entry.color || CHART_COLORS.light} />;
    });
  }, [activityBreakdownData]);

  // Memoize the gradient definition for the area chart
  const areaDefs = useMemo(() => (
    <defs>
      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={CHART_COLORS.light} stopOpacity={0.8} />
        <stop offset="95%" stopColor={CHART_COLORS.light} stopOpacity={0} />
      </linearGradient>
    </defs>
  ), []);

  // Show a loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <SlideIn from="top" duration={0.5}>
        <header className="border-b border-zinc-800/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              <h1 className="text-lg font-bold">YouTube Analytics</h1>
            </div>
            <div className="flex items-center gap-2">
              {session && (
                <>
                  <Button variant="default" size="sm" onClick={() => window.location.href = '/youtube-data'} className="bg-red-600 hover:bg-red-700">
                    <Youtube className="h-4 w-4 mr-1.5" />
                    YouTube Data
                  </Button>
                  <Button variant="ghost" size="sm" onClick={togglePage}>
                    {activePage === "dashboard" ? (
                      <>
                        <Settings className="h-4 w-4 mr-1.5" />
                        Settings
                      </>
                    ) : (
                      <>
                        <Youtube className="h-4 w-4 mr-1.5" />
                        Dashboard
                      </>
                    )}
                  </Button>
                </>
              )}
              {session && (
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </header>
      </SlideIn>

      <main className="flex-1 container py-4 overflow-x-hidden">
        {!session ? (
          <FadeIn delay={0.2} duration={0.5}>
            <div className="h-[calc(100vh-3.5rem-2rem)] flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-4">Welcome to YouTube Analytics</h2>
              <p className="text-muted-foreground mb-6">Please log in with your Google account to continue.</p>
              <Button size="lg" onClick={() => signIn("google")}>
                <LogIn className="h-4 w-4 mr-2" />
                Login with Google
              </Button>
            </div>
          </FadeIn>
        ) : activePage === "dashboard" ? (
          <div className="h-[calc(100vh-3.5rem-2rem)] grid grid-rows-[auto_1fr] gap-4">
            {isLoading && (
              <FadeIn delay={0.2} duration={0.5}>
                <div className="flex justify-center p-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/30">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-sm">Loading YouTube data...</span>
                  </div>
                </div>
              </FadeIn>
            )}

            {isError && error && (
              <FadeIn delay={0.2} duration={0.5}>
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500 bg-red-500/10 text-red-500">
                    <span className="text-sm">{error.message || "Failed to load YouTube data"}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={refetch}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              </FadeIn>
            )}

            {!isLoading && !isError && (
              <FadeIn delay={0.2} duration={0.5}>
                <div className="flex justify-center">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-yellow-400 hover:bg-yellow-500"
                    onClick={() => window.location.href = '/watch-history'}
                  >
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Watch History Analytics
                  </Button>
                </div>
              </FadeIn>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-4 h-full pb-8">
              <SlideIn from="top" delay={0.3} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg h-full">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Monthly YouTube Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#948979]/20" onClick={refetch}>
                      <RefreshCw className="h-3.5 w-3.5 text-[#DFD0B8]" />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                    {monthlyActivityData.length > 0 && (
                      <ChartContainer minHeight={300}>
                        <BarChart
                          data={monthlyActivityData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                          barSize={20}
                          barGap={3}
                        >
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: "#FFFFFF" }} 
                            stroke="#FFFFFF" 
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: "#FFFFFF" }} 
                            stroke="#FFFFFF"
                            tickFormatter={formatNumber} 
                          />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            formatter={tooltipFormatter}
                          />
                          <Legend formatter={legendFormatter} />
                          <Bar dataKey="likes" stackId="a" fill={CHART_COLORS.likes} name="likes" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="playlists" stackId="a" fill={CHART_COLORS.playlists} name="playlists" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="subscriptions" stackId="a" fill={CHART_COLORS.subscriptions} name="subscriptions" radius={[0, 0, 4, 4]} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </SlideIn>

              <SlideIn from="top" delay={0.4} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg h-full">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Activity Breakdown</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#948979]/20" onClick={refetch}>
                      <RefreshCw className="h-3.5 w-3.5 text-[#DFD0B8]" />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                    {activityBreakdownData.length > 0 && (
                      <ChartContainer minHeight={300}>
                        <PieChart>
                          <Pie
                            data={activityBreakdownData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={false} // Removing the static percentage labels
                          >
                            {pieChartCells}
                          </Pie>
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            formatter={(value, name) => {
                              // Create custom tooltip content with proper colors
                              let color;
                              if (name === "Likes") {
                                color = CHART_COLORS.likes;
                              } else if (name === "Playlists") {
                                color = CHART_COLORS.playlists;
                              } else if (name === "Subscriptions") {
                                color = CHART_COLORS.subscriptions;
                              } else {
                                color = CHART_COLORS.light;
                              }
                              
                              return [
                                <span style={{ color: "#FFFFFF" }}>{value}</span>, 
                                <span style={{ color }}>{name}</span>
                              ];
                            }}
                          />
                          {!isLoading && <Legend 
                            formatter={(value) => {
                              // Determine text color based on name
                              let textColor;
                              if (value === "Likes") {
                                textColor = CHART_COLORS.likes;
                              } else if (value === "Playlists") {
                                textColor = CHART_COLORS.playlists;
                              } else if (value === "Subscriptions") {
                                textColor = CHART_COLORS.subscriptions;
                              } else {
                                textColor = CHART_COLORS.light;
                              }
                              return <span className="text-xs" style={{ color: textColor }}>{value}</span>;
                            }} 
                          />}
                        </PieChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </SlideIn>

              <SlideIn from="top" delay={0.5} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg h-full">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Activity Trends</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#948979]/20" onClick={refetch}>
                      <RefreshCw className="h-3.5 w-3.5 text-[#DFD0B8]" />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                    {monthlyActivityData.length > 0 && (
                      <ChartContainer minHeight={300}>
                        <AreaChart 
                          data={monthlyActivityData} 
                          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.light} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={CHART_COLORS.light} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: "#FFFFFF" }} 
                            stroke="#FFFFFF"
                            angle={-45}
                            textAnchor="end"
                            height={50} 
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: "#FFFFFF" }} 
                            stroke="#FFFFFF"
                            tickFormatter={formatNumber} 
                          />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            formatter={(value) => [value, "Total Activity"]}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke={"#FFFFFF"} 
                            fillOpacity={1} 
                            fill="url(#colorTotal)"
                            name="Total Activity" 
                          />
                        </AreaChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </SlideIn>

              <SlideIn from="top" delay={0.6} duration={0.5}>
                <Card className="overflow-hidden bg-[#393E46] border-[#948979]/40 shadow-lg h-full">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-medium text-white">Quick Stats</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#948979]/20" onClick={refetch}>
                      <RefreshCw className="h-3.5 w-3.5 text-[#DFD0B8]" />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-[calc(100%-2.75rem)]">
                    {isLoading ? (
                      <div className="text-center text-gray-400 dark:text-gray-600">
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-32 rounded mx-auto"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 w-full px-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: CHART_COLORS.likes }}>{formatNumber(totalLikes)}</div>
                          <p className="text-xs mt-1" style={{ color: CHART_COLORS.likes }}>Liked Videos</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: CHART_COLORS.playlists }}>{formatNumber(totalPlaylists)}</div>
                          <p className="text-xs mt-1" style={{ color: CHART_COLORS.playlists }}>Playlists</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: CHART_COLORS.subscriptions }}>{formatNumber(totalSubscriptions)}</div>
                          <p className="text-xs mt-1" style={{ color: CHART_COLORS.subscriptions }}>Subscriptions</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </SlideIn>
            </div>
          </div>
        ) : (
          <FadeIn delay={0.2} duration={0.5}>
            <div className="h-[calc(100vh-3.5rem-2rem)] flex items-center justify-center">
              <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-zinc-200">Settings</CardTitle>
                  {session?.user && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Signed in as {session.user.name} ({session.user.email})
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="account">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
                      <TabsTrigger value="account" className="data-[state=active]:bg-zinc-700/50">
                        Account
                      </TabsTrigger>
                      <TabsTrigger value="preferences" className="data-[state=active]:bg-zinc-700/50">
                        Preferences
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="account" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">Google Account</h3>
                        {session ? (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-400">You are connected with your Google account.</p>
                            <Button size="sm" variant="outline" onClick={() => signOut()}>
                              Sign Out
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Connect your Google account to access your YouTube data</p>
                            <Button size="sm" className="gap-2 mt-2 bg-violet-600 hover:bg-violet-700" onClick={() => signIn("google")}>
                              <LogIn className="h-3 w-3" />
                              Login with Google
                            </Button>
                          </>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="preferences" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">Theme Settings</h3>
                        <p className="text-sm text-gray-600 dark:text-zinc-400">Choose between light and dark mode</p>
                        
                        <div className="flex flex-col space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MoonIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
                              <span className="text-sm text-gray-700 dark:text-zinc-300">Dark Mode</span>
                            </div>
                            <Switch 
                              checked={theme === "dark"} 
                              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                              className="data-[state=checked]:bg-violet-600"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-zinc-500 italic">
                            Current mode: {theme === "dark" ? "Dark" : "Light"}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  )
}
