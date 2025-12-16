/**
 * Session Manager
 *
 * Orchestrates all session management logic including:
 * - Activity monitoring
 * - Proactive token refresh
 * - Idle warnings and auto-logout
 */

import { activityMonitor } from './activityMonitor';
import { useAuthStore } from './store/authStore';

// Configuration constants (Conservative settings)
export const SESSION_CONFIG = {
  // Time before showing idle warning (5 minutes)
  IDLE_WARNING_TIME: 5 * 60 * 1000,

  // Time before forcing logout (7 minutes)
  IDLE_LOGOUT_TIME: 7 * 60 * 1000,

  // Token expiry time (15 minutes from backend)
  TOKEN_EXPIRY_TIME: 15 * 60 * 1000,

  // Time before expiry to proactively refresh (3 minutes before)
  REFRESH_BEFORE_EXPIRY: 3 * 60 * 1000,

  // Proactive refresh check interval (every 30 seconds)
  REFRESH_CHECK_INTERVAL: 30 * 1000,
};

class SessionManager {
  private refreshCheckInterval: NodeJS.Timeout | null = null;
  private lastTokenRefreshTime: number = 0;
  private isInitialized = false;
  private warningCallback: ((timeRemaining: number) => void) | null = null;

  /**
   * Initialize session management
   */
  initialize(onIdleWarning: (timeRemaining: number) => void): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.lastTokenRefreshTime = Date.now();
    this.warningCallback = onIdleWarning;

    // Configure activity monitor with conservative settings
    activityMonitor.updateConfig({
      warningTime: SESSION_CONFIG.IDLE_WARNING_TIME,
      logoutTime: SESSION_CONFIG.IDLE_LOGOUT_TIME,
    });

    // Start activity monitoring
    activityMonitor.start({
      onIdleWarning: (idleTime) => {
        const timeRemaining = SESSION_CONFIG.IDLE_LOGOUT_TIME - idleTime;
        if (this.warningCallback) {
          this.warningCallback(timeRemaining);
        }
      },
      onIdleLogout: async () => {
        await this.forceLogout('Session expired due to inactivity');
      },
    });

    // Start proactive token refresh monitoring
    this.startProactiveRefresh();
  }

  /**
   * Start proactive token refresh monitoring
   */
  private startProactiveRefresh(): void {
    this.refreshCheckInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, SESSION_CONFIG.REFRESH_CHECK_INTERVAL);
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  private async checkAndRefreshToken(): Promise<void> {
    const now = Date.now();
    const tokenExpiresAt = useAuthStore.getState().tokenExpiresAt;

    if (!tokenExpiresAt) {
      return; // No token expiry time available
    }

    const timeUntilExpiry = tokenExpiresAt - now;

    // If token will expire soon and user is active, refresh proactively
    if (timeUntilExpiry <= SESSION_CONFIG.REFRESH_BEFORE_EXPIRY) {
      const idleTime = activityMonitor.getIdleTime();

      // Only refresh if user is active (idle less than warning time)
      if (idleTime < SESSION_CONFIG.IDLE_WARNING_TIME) {
        try {
          await useAuthStore.getState().refreshTokens();
          this.lastTokenRefreshTime = Date.now();
        } catch (error) {
          console.error('Proactive token refresh failed:', error);
          // Don't force logout here, let the reactive refresh handle it
        }
      }
    }
  }

  /**
   * Handle "Stay Logged In" action from warning modal
   */
  async handleStayLoggedIn(): Promise<void> {
    try {
      // Reset activity timer
      activityMonitor.resetIdleTimer();

      // Refresh tokens
      await useAuthStore.getState().refreshTokens();
      this.lastTokenRefreshTime = Date.now();
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await this.forceLogout('Session refresh failed');
    }
  }

  /**
   * Force logout with reason
   */
  private async forceLogout(reason: string): Promise<void> {
    console.log('Force logout:', reason);
    await useAuthStore.getState().logout();

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Cleanup and stop all monitoring
   */
  cleanup(): void {
    this.isInitialized = false;
    activityMonitor.stop();

    if (this.refreshCheckInterval) {
      clearInterval(this.refreshCheckInterval);
      this.refreshCheckInterval = null;
    }
  }

  /**
   * Notify session manager that token was refreshed
   * (called from API interceptor or manual refresh)
   */
  notifyTokenRefresh(): void {
    this.lastTokenRefreshTime = Date.now();
  }

  /**
   * Get time remaining until idle logout (in milliseconds)
   */
  getTimeUntilLogout(): number {
    const idleTime = activityMonitor.getIdleTime();
    return Math.max(0, SESSION_CONFIG.IDLE_LOGOUT_TIME - idleTime);
  }

  /**
   * Check if session manager is initialized
   */
  isActive(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
