import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { JWT } from "next-auth/jwt"
import { Account, Session } from "next-auth"

// Extend the built-in session type
interface ExtendedSession extends Session {
  accessToken?: string;
}

// Extend the built-in token type
interface ExtendedToken extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable")
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable")
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Restore YouTube API scope for test users
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: { token: ExtendedToken, account: Account | null, user: any }) {
      // Initial sign-in
      if (account && user) {
        console.log("Initial sign-in, setting token data");
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000, // 1 hour
          user
        };
      }

      // Return the previous token if the access token has not expired
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log("Token still valid, returning existing token");
        return token;
      }

      // Access token expired, try to refresh it
      console.log("Token expired, attempting to refresh");
      try {
        if (!token.refreshToken) {
          console.error("No refresh token available");
          return { ...token, error: "RefreshAccessTokenError" };
        }

        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID as string,
            client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
          console.error("Error refreshing token:", refreshedTokens);
          return { ...token, error: "RefreshAccessTokenError" };
        }

        console.log("Token refreshed successfully");
        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          // Fall back to old refresh token if a new one wasn't provided
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 3600) * 1000,
        };
      } catch (error) {
        console.error("Error refreshing access token:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }: { session: ExtendedSession, token: ExtendedToken }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      
      // Add error information to the session if token refresh failed
      if (token.error) {
        (session as any).error = token.error;
      }
      
      return session;
    }
  },
  // Using JWT strategy for storing session data
  session: {
    strategy: "jwt",
    // Increase max age to avoid frequent re-authentication
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development"
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
