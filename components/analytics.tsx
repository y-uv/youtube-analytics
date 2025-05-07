"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { FileJson, Github, LogIn, Settings, Youtube } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn, SlideIn } from "@/components/motion-wrapper";
import { generateActivityBreakdownData, generateMonthlyActivityData } from "@/lib/analytics-utils"
import { LikedVideo, Playlist, Subscription, LikedVideosResponse, PlaylistsResponse, SubscriptionsResponse } from "@/types/youtube"

export function Analytics() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [activePage, setActivePage] = useState("dashboard")
  const [fileUploaded, setFileUploaded] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // YouTube data states
  const [likedVideos, setLikedVideos] = useState<LikedVideo[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Activity statistics states
  const [monthlyActivityData, setMonthlyActivityData] = useState<any[]>([])
  const [activityBreakdownData, setActivityBreakdownData] = useState<any[]>([])

  // Fetch YouTube data when authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchYouTubeData();
    }
  }, [status, session]);

  // Process data whenever the source data changes
  useEffect(() => {
    // Generate monthly activity data
    const monthlyData = generateMonthlyActivityData(likedVideos, playlists, subscriptions);
    setMonthlyActivityData(monthlyData);

    // Generate activity breakdown data for pie chart
    const breakdownData = generateActivityBreakdownData(likedVideos, playlists, subscriptions);
    setActivityBreakdownData(breakdownData);
  }, [likedVideos, playlists, subscriptions]);

  const fetchYouTubeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch liked videos
      const likedRes = await fetch('/api/youtube/liked-videos');
      const likedData: LikedVideosResponse = await likedRes.json();
      
      if (!likedRes.ok && likedData.error) {
        console.error("Error fetching liked videos:", likedData.error);
      } else {
        setLikedVideos(likedData.items || []);
      }
      
      // Fetch playlists
      const playlistsRes = await fetch('/api/youtube/playlists');
      const playlistsData: PlaylistsResponse = await playlistsRes.json();
      
      if (!playlistsRes.ok && playlistsData.error) {
        console.error("Error fetching playlists:", playlistsData.error);
      } else {
        setPlaylists(playlistsData.items || []);
      }
      
      // Fetch subscriptions
      const subsRes = await fetch('/api/youtube/subscriptions');
      const subsData: SubscriptionsResponse = await subsRes.json();
      
      if (!subsRes.ok && subsData.error) {
        console.error("Error fetching subscriptions:", subsData.error);
      } else {
        setSubscriptions(subsData.subscriptions || []);
      }
      
    } catch (err) {
      console.error("Error fetching YouTube data:", err);
      setError("Failed to load YouTube data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Updated pastel color palette
  const PASTEL_COLORS = ["#ffb3ba", "#baffc9", "#ffffba", "#bae1ff", "#e0baff"];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle the file
      setFileUploaded(true)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Handle the file
      setFileUploaded(true)
    }
  }

  const togglePage = () => {
    setActivePage(activePage === "dashboard" ? "settings" : "dashboard")
  }

  // Show a loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading...</p>
      </div>
    )
  }

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Calculate total activity numbers
  const totalLikes = likedVideos.length;
  const totalPlaylists = playlists.length;
  const totalSubscriptions = subscriptions.length;
  const totalActivities = totalLikes + totalPlaylists + totalSubscriptions;

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
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </a>
              {session ? (
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              ) : (
                <Button size="sm" onClick={() => signIn("google")}>
                  <LogIn className="h-3 w-3 mr-1.5" />
                  Login with Google
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

            {error && (
              <FadeIn delay={0.2} duration={0.5}>
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500 bg-red-500/10 text-red-500">
                    <span className="text-sm">{error}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={fetchYouTubeData}>
                      Retry
                    </Button>
                  </div>
                </div>
              </FadeIn>
            )}

            {!fileUploaded && !isLoading && !error && (
              <FadeIn delay={0.2} duration={0.5}>
                <div className="flex justify-center">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      dragActive ? "border-primary ring-1 ring-primary" : "border-zinc-800/30"
                    } bg-zinc-900/30`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <FileJson className="h-4 w-4 text-violet-400" />
                    <span className="text-sm">Drop watch-history.json here</span>
                    <input type="file" id="file-upload" className="hidden" accept=".json" onChange={handleFileChange} />
                    <label htmlFor="file-upload">
                      <Button variant="ghost" size="sm" className="h-7 cursor-pointer">
                        Browse
                      </Button>
                    </label>
                  </div>
                </div>
              </FadeIn>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-4 h-full">
              <SlideIn from="left" delay={0.3} duration={0.5}>
                <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800/30 shadow-lg h-full">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium text-zinc-200">Monthly YouTube Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyActivityData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        barSize={20}
                        barGap={3}
                      >
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }} 
                          stroke="hsl(var(--muted-foreground))" 
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={formatNumber} 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                          formatter={(value, name) => {
                            const formattedName = name === "likes" 
                              ? "Likes" 
                              : name === "playlists" 
                              ? "Playlists" 
                              : name === "subscriptions" 
                              ? "Subscriptions" 
                              : name;
                            return [value, formattedName];
                          }}
                        />
                        <Legend 
                          formatter={(value) => {
                            const formattedValue = value === "likes" 
                              ? "Likes" 
                              : value === "playlists" 
                              ? "Playlists" 
                              : value === "subscriptions" 
                              ? "Subscriptions" 
                              : value;
                            return <span className="text-xs">{formattedValue}</span>;
                          }}
                        />
                        <Bar dataKey="likes" stackId="a" fill={PASTEL_COLORS[0]} name="likes" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="playlists" stackId="a" fill={PASTEL_COLORS[1]} name="playlists" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="subscriptions" stackId="a" fill={PASTEL_COLORS[3]} name="subscriptions" radius={[0, 0, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </SlideIn>

              <SlideIn from="right" delay={0.4} duration={0.5}>
                <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800/30 shadow-lg h-full">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium text-zinc-200">Activity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityBreakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {activityBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </SlideIn>

              <SlideIn from="left" delay={0.5} duration={0.5}>
                <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800/30 shadow-lg h-full">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium text-zinc-200">Activity Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyActivityData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={PASTEL_COLORS[4]} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={PASTEL_COLORS[4]} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }} 
                          stroke="hsl(var(--muted-foreground))"
                          angle={-45}
                          textAnchor="end"
                          height={50} 
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={formatNumber} 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [value, "Total Activity"]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          stroke={PASTEL_COLORS[4]} 
                          fillOpacity={1} 
                          fill="url(#colorTotal)"
                          name="Total Activity" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </SlideIn>

              <SlideIn from="right" delay={0.6} duration={0.5}>
                <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800/30 shadow-lg h-full">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium text-zinc-200">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-[calc(100%-2.75rem)]">
                    <div className="grid grid-cols-3 gap-8 w-full px-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{formatNumber(totalLikes)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Liked Videos</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{formatNumber(totalPlaylists)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Playlists</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{formatNumber(totalSubscriptions)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Subscriptions</p>
                      </div>
                    </div>
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
                  <CardTitle className="text-zinc-200">Settings</CardTitle>
                  {session?.user && (
                    <p className="text-sm text-muted-foreground">
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
                        <h3 className="text-sm font-medium text-zinc-200">Google Account</h3>
                        {session ? (
                          <>
                            <p className="text-sm text-muted-foreground">You are connected with your Google account.</p>
                            <Button size="sm" variant="outline" onClick={() => signOut()}>
                              Sign Out
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">Connect your Google account to access your YouTube data</p>
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
                        <h3 className="text-sm font-medium text-zinc-200">Data Preferences</h3>
                        <p className="text-sm text-zinc-400">Choose what data to display on your dashboard</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                            Reset Data
                          </Button>
                          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                            Export Data
                          </Button>
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
