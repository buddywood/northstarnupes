import { API_URL } from './constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@1kappa:token';
const USER_KEY = '@1kappa:user';
const REFRESH_TOKEN_KEY = '@1kappa:refresh_token';
const REMEMBER_ME_KEY = '@1kappa:remember_me';

// Global callbacks that can be called from API layer
let globalLogoutCallback: (() => Promise<void>) | null = null;
let globalRefreshTokenCallback: (() => Promise<boolean>) | null = null;

export function setLogoutCallback(callback: () => Promise<void>) {
  globalLogoutCallback = callback;
}

export function setRefreshTokenCallback(callback: () => Promise<boolean>) {
  globalRefreshTokenCallback = callback;
}

/**
 * Attempts to refresh the token using the stored refresh token
 */
async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
    
    if (!storedRefreshToken || rememberMe !== 'true') {
      return false;
    }

    const refreshResponse = await fetch(`${API_URL}/api/members/cognito/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!refreshResponse.ok) {
      return false;
    }

    const { tokens, user: refreshedUser } = await refreshResponse.json();
    
    // Store new tokens
    await AsyncStorage.setItem(TOKEN_KEY, tokens.idToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken || storedRefreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify({
      ...refreshedUser,
      is_fraternity_member: !!refreshedUser.memberId,
      is_seller: !!refreshedUser.sellerId,
      is_promoter: !!refreshedUser.promoterId,
      is_steward: !!refreshedUser.stewardId,
    }));

    // Call global refresh callback if available to update auth state
    if (globalRefreshTokenCallback) {
      await globalRefreshTokenCallback();
    }

    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

/**
 * Wrapper around fetch that automatically handles 401 errors by attempting token refresh
 * If refresh fails or remember me is off, logs out the user
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let response = await fetch(url, options);

  // If we get a 401 Unauthorized, try to refresh the token first
  if (response.status === 401) {
    console.log('Received 401 Unauthorized - attempting token refresh...');
    
    const refreshSuccess = await attemptTokenRefresh();
    
    if (refreshSuccess) {
      console.log('Token refreshed successfully - retrying request');
      // Retry the original request with the new token
      const newToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (newToken && options.headers) {
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        options.headers = headers;
      }
      response = await fetch(url, options);
      
      // If retry still fails, logout
      if (response.status === 401) {
        console.log('Retry after refresh still returned 401 - logging out');
        await handleLogout();
        const error = new Error('Your session has expired. Please log in again.');
        (error as any).code = 'SESSION_EXPIRED';
        throw error;
      }
    } else {
      console.log('Token refresh failed - logging out');
      await handleLogout();
      const error = new Error('Your session has expired. Please log in again.');
      (error as any).code = 'SESSION_EXPIRED';
      throw error;
    }
  }

  return response;
}

/**
 * Handles logout by clearing tokens and calling logout callback
 */
async function handleLogout() {
  // Clear stored tokens
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY]);
  
  // Call global logout callback if available
  if (globalLogoutCallback) {
    try {
      await globalLogoutCallback();
    } catch (error) {
      console.error('Error during automatic logout:', error);
    }
  }
}

