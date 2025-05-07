# YouTube Analytics

A sophisticated application for analyzing and visualizing YouTube activity data, built with modern web technologies.

## Overview

YouTube Analytics is a web application that allows users to authenticate with their Google account and visualize analytics about their YouTube activity. The application analyzes liked videos, playlists, subscriptions, and watch history to provide insightful visualizations and statistics.

## System Design

### Architecture

The application follows a client-server architecture built on Next.js, with the following main components:

1. **Frontend**: React-based UI components with animations and visualizations
2. **API Routes**: Server-side API endpoints that interact with the YouTube API
3. **Authentication**: Google OAuth integration via NextAuth.js
4. **Data Visualization**: Interactive charts using Recharts

### Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://reactjs.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **API Integration**: [Google YouTube API v3](https://developers.google.com/youtube/v3)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Application Features

- Google OAuth authentication with secure token refresh
- YouTube data fetching (liked videos, playlists, subscriptions, channel statistics)
- Interactive dashboard with various chart visualizations
- Monthly activity breakdown and trends
- Activity type distribution via pie charts
- Responsive design for all device sizes
- Dark mode support
- Animated transitions and UI elements

## Directory Structure

```
youtube-analytics/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # API endpoints
│   │   ├── auth/         # Authentication API (NextAuth)
│   │   └── youtube/      # YouTube data endpoints
│   └── youtube-data/     # YouTube data page
├── components/           # React components
│   ├── ui/               # UI components
│   ├── analytics.tsx     # Main analytics dashboard
│   ├── auth-provider.tsx # Authentication provider
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── youtube.ts        # YouTube API utilities
│   └── analytics-utils.ts # Analytics data processing utilities
├── public/               # Static assets
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

## Color Scheme

The application uses a custom color scheme:
- **Background**: Dark theme (#222831)
- **Card Background**: Dark gray (#393E46)
- **Accent**: Taupe (#948979)
- **Text**: Light beige (#DFD0B8) and White (#FFFFFF)
- **Chart Colors**:
  - Likes: Red (#FF5252)
  - Playlists: Green (#4CAF50)
  - Subscriptions: Blue (#2196F3)

## Authentication Flow

1. User signs in with Google account via NextAuth
2. OAuth tokens are securely stored in JWT session
3. Access token automatically refreshes when expired
4. YouTube API calls use the authenticated token for data access

## API Integration

The application interacts with the following YouTube API endpoints:
- `subscriptions.list`: Fetch user's channel subscriptions
- `playlists.list`: Fetch user's playlists
- `playlistItems.list`: Fetch user's liked videos and watch history
- `channels.list`: Fetch user's channel statistics

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables:
   ```
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Run the development server: `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Future Enhancements

- Watch history analysis and visualization
- Content category breakdown
- Viewing habits by time of day
- Channel recommendations based on activity
- Export functionality for data