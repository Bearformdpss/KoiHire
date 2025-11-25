/**
 * Token Refresh Manager
 *
 * Implements a mutex lock to prevent concurrent token refresh attempts.
 * When multiple API calls fail with 401 simultaneously, only one refresh
 * request is made while others wait for the result.
 */

type RefreshPromise = Promise<{ accessToken: string; refreshToken: string }>;

class TokenRefreshManager {
  private refreshPromise: RefreshPromise | null = null;
  private isRefreshing = false;

  /**
   * Attempts to refresh the token. If a refresh is already in progress,
   * returns the existing promise instead of creating a new one.
   */
  async refresh(refreshFn: () => RefreshPromise): Promise<{ accessToken: string; refreshToken: string }> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start new refresh
    this.isRefreshing = true;
    this.refreshPromise = refreshFn()
      .then((result) => {
        this.isRefreshing = false;
        this.refreshPromise = null;
        return result;
      })
      .catch((error) => {
        this.isRefreshing = false;
        this.refreshPromise = null;
        throw error;
      });

    return this.refreshPromise;
  }

  /**
   * Check if a refresh is currently in progress
   */
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Clear the refresh state (used for testing or manual reset)
   */
  reset(): void {
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}

// Export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();
