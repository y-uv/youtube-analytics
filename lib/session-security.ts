/**
 * Session Security Utilities
 * 
 * This module provides utilities for enhanced session security and management,
 * particularly to address issues with sessions persisting across different users.
 */

/**
 * Clears all auth-related browser storage to prevent session persistence issues
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Get domain for cookie clearing (helps with custom domains on Netlify)
    const hostname = window.location.hostname;
    const domain = hostname === 'localhost' ? '' : hostname;
    
    // Clear potential auth cookies - both with and without domain
    document.cookie.split(';').forEach(c => {
      const trimmed = c.trim();
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const name = trimmed.substring(0, equalIndex);
        
        // Clear for all potential auth-related cookies
        if (name.includes('next-auth') || name.includes('token') || 
            name.includes('session') || name.includes('__Secure')) {
          // Clear with path but no domain (default)
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          
          // Also try with domain specified (for Netlify and custom domains)
          if (domain) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain};`;
          }
          
          // Also try with secure prefix
          document.cookie = `__Secure-${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`;
        }
      }
    });

    // Clear localStorage items related to auth
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('next-auth') || 
        key.includes('token') || 
        key.includes('session') || 
        key.includes('user') ||
        key.includes('google')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear potential sessionStorage items
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('next-auth') || 
        key.includes('token') || 
        key.includes('session') ||
        key.includes('user') ||
        key.includes('google')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (err) {
    console.error('Error clearing auth storage:', err);
  }
}

/**
 * Generates a unique browser fingerprint to help identify different users
 * This is used as an additional security check, not for tracking
 */
export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  try {
    // Basic fingerprinting using available browser info
    // This is used for security purposes only, not for tracking
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      colorDepth: screen.colorDepth,
      resolution: `${screen.width},${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionStorage: !!window.sessionStorage,
      localStorage: !!window.localStorage,
      cpuCores: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      timestamp: new Date().toISOString().slice(0, 10), // Just the date part
    };
    
    // Convert to string and hash to get a consistent fingerprint
    const fingerprintStr = JSON.stringify(fingerprint);
    
    // Simple string hashing function
    let hash = 0;
    for (let i = 0; i < fingerprintStr.length; i++) {
      const char = fingerprintStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(36); // Convert to base36 string
  } catch (error) {
    console.error('Error creating browser fingerprint:', error);
    return '';
  }
}

/**
 * Enhanced sign out function that ensures complete removal of all auth data
 */
export async function enhancedSignOut(): Promise<void> {
  // First clear all client-side storage
  clearAuthStorage();
  
  // Then request the server to clear the session
  try {
    await fetch('/api/auth/signout', { method: 'POST' });
  } catch (error) {
    console.error('Error during server sign out:', error);
  }
  
  // Reload the page to ensure a fresh state
  window.location.href = '/';
}
