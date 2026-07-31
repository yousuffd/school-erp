'use client';

import { AuthUser } from './types';

const ACCESS_TOKEN_KEY = 'schoolerp_access_token';
const REFRESH_TOKEN_KEY = 'schoolerp_refresh_token';
const USER_KEY = 'schoolerp_user';

/**
 * Thin wrapper around localStorage for the browser session. This is a real
 * deployed app (not a Claude Artifact sandbox), so localStorage is the right
 * tool here — swap for httpOnly cookies + a BFF session if/when this needs to
 * be hardened against XSS token theft (worth revisiting before Phase 1 GA).
 */
export const auth = {
  saveSession(accessToken: string, refreshToken: string, user: AuthUser) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
