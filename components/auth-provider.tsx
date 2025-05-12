'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import React, { useEffect } from 'react'
import { clearAuthStorage, getBrowserFingerprint } from '@/lib/session-security'

interface AuthProviderProps {
  children: React.ReactNode
}

// This component wraps the children with session checks
function SessionCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  
  useEffect(() => {
    // Check session on mount and when session changes
    const verifySession = async () => {
      if (status === 'authenticated' && session) {
        try {
          // Get browser fingerprint for additional verification
          const fingerprint = await getBrowserFingerprint();
          
          // Store the fingerprint in sessionStorage for cross-check
          sessionStorage.setItem('browser_fingerprint', fingerprint);
          
          // If the session has a sessionId but no fingerprint, or they don't match,
          // this could indicate a cross-user session issue
          const sessionFingerprint = (session as any).browserFingerprint;
          if (sessionFingerprint && sessionFingerprint !== fingerprint) {
            console.warn('Session fingerprint mismatch - possible security issue');
            // Clear auth storage immediately
            clearAuthStorage();
            // Reload the page to trigger new auth flow
            window.location.href = '/';
          }
        } catch (error) {
          console.error('Error verifying session:', error);
        }
      }
    };
    
    verifySession();
  }, [session, status]);
  
  return <>{children}</>;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // Clear any potentially problematic local storage items on mount
  useEffect(() => {
    // Initialize session security measures
    const initSessionSecurity = async () => {
      // Clear any existing authentication artifacts
      clearAuthStorage();
      
      // Set additional security attributes
      if (typeof window !== 'undefined') {
        // Use a more secure storage approach
        try {
          // Mark this as a fresh session
          sessionStorage.setItem('session_initialized', Date.now().toString());
          
          // Add listener for storage changes across tabs
          window.addEventListener('storage', (event) => {
            // If another tab changes auth-related storage, reload this page
            if (event.key?.includes('auth') || event.key?.includes('token') || 
                event.key?.includes('session')) {
              window.location.reload();
            }
          });
        } catch (err) {
          console.error('Error setting up session security:', err);
        }
      }
    };
    
    initSessionSecurity();
    
    // Return cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', () => {});
      }
    };
  }, []);
  // Determine if we need more aggressive refresh in production
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost';
    
  return (
    <SessionProvider 
      refetchInterval={isProduction ? 60 * 2 : 60 * 5} // More frequent in production
      refetchOnWindowFocus={true} 
      refetchWhenOffline={false}
    >
      <SessionCheck>{children}</SessionCheck>
    </SessionProvider>
  )
}
