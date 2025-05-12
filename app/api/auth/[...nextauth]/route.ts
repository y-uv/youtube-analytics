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
          // Always show the consent screen to ensure the user is aware which account they're using
          prompt: "select_account consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],  callbacks: {
    // Callback to handle sign-in events
    async signIn({ user, account, profile, email }: { user: any, account: Account | null, profile?: any, email?: any }) {
      // Store the sign-in timestamp and additional security metadata in the token
      if (user) {
        // Add security-related metadata to help identify different users
        (user as any).lastSignIn = new Date().toISOString();
        (user as any).sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        // Store the email explicitly to add another layer of verification
        if (email) {
          (user as any).emailVerified = email;
        }
        
        // Log sign in attempt with datetime for security auditing
        console.log(`Sign-in attempt for user: ${user.email} at ${new Date().toISOString()}`);
      }
      return true; // Return true to allow sign in
    },
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
    },    async session({ session, token, trigger }: { session: ExtendedSession, token: ExtendedToken, trigger?: any }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      
      // Add error information to the session if token refresh failed
      if (token.error) {
        (session as any).error = token.error;
      }
      
      // Add session security metadata
      (session as any).sessionId = (token as any).sessionId || `session_${Date.now()}`;
      (session as any).lastVerified = new Date().toISOString();
      
      // Ensure email verification consistency
      if (session.user?.email !== (token as any).email) {
        console.warn("Email mismatch detected in session. Expected:", (token as any).email, "Got:", session.user?.email);
        // Don't return session data if emails don't match
        if (process.env.NODE_ENV === "production") {
          return null; // Force re-authentication in production
        }
      }
      
      return session;
    }},    // Using JWT strategy for storing session data  
  session: {
    strategy: "jwt",
    // Shorter session duration (2 hours) to reduce risk of session hijacking
    maxAge: 2 * 60 * 60, // 2 hours
  },
  // Use a strong secret for session encryption
  secret: process.env.NEXTAUTH_SECRET,
  // Configure cookies with environment-appropriate settings
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60, // 2 hours instead of 24 hours
        domain: process.env.COOKIE_DOMAIN || undefined, // Use custom domain if specified
      }
    },
    // Additional cookies configuration for strict session control in production
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      }
    }
  },
  debug: process.env.NODE_ENV === "development"
}

const handler = NextAuth(authOptions as any)

export { handler as GET, handler as POST }
