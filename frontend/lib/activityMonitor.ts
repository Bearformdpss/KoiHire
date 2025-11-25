/**
 * Activity Monitor
 *
 * Tracks user activity (mouse, keyboard, touch, scroll) to determine
 * if the user is idle. Emits events for idle warnings and auto-logout.
 */

type ActivityCallback = (idleTime: number) => void;

class ActivityMonitor {
  private lastActivityTime: number = Date.now();
  private activityListeners: (() => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private callbacks: {
    onIdleWarning?: ActivityCallback;
    onIdleLogout?: ActivityCallback;
  } = {};

  // Configuration (milliseconds)
  private config = {
    warningTime: 5 * 60 * 1000,  // 5 minutes (conservative)
    logoutTime: 7 * 60 * 1000,   // 7 minutes (conservative)
    checkInterval: 1000,          // Check every second
    debounceTime: 500,            // Debounce activity events
  };

  private warningShown = false;
  private debounceTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize the activity monitor
   */
  start(callbacks: {
    onIdleWarning?: ActivityCallback;
    onIdleLogout?: ActivityCallback;
  }): void {
    if (this.isMonitoring) {
      return;
    }

    this.callbacks = callbacks;
    this.lastActivityTime = Date.now();
    this.warningShown = false;
    this.isMonitoring = true;

    // Register activity listeners
    this.registerActivityListeners();

    // Start checking for idle time
    this.checkInterval = setInterval(() => {
      this.checkIdleTime();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring activity
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.removeActivityListeners();

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Register all activity event listeners
   */
  private registerActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => this.recordActivity();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
      this.activityListeners.push(() => {
        window.removeEventListener(event, handleActivity);
      });
    });

    // Also listen for visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        this.recordActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.activityListeners.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  /**
   * Remove all activity event listeners
   */
  private removeActivityListeners(): void {
    this.activityListeners.forEach((removeListener) => removeListener());
    this.activityListeners = [];
  }

  /**
   * Record user activity (debounced)
   */
  private recordActivity(): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.lastActivityTime = Date.now();

      // Reset warning flag if user becomes active again
      if (this.warningShown) {
        this.warningShown = false;
      }
    }, this.config.debounceTime);
  }

  /**
   * Check idle time and trigger callbacks
   */
  private checkIdleTime(): void {
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;

    // Check if we should show warning
    if (idleTime >= this.config.warningTime && !this.warningShown) {
      this.warningShown = true;
      if (this.callbacks.onIdleWarning) {
        this.callbacks.onIdleWarning(idleTime);
      }
    }

    // Check if we should force logout
    if (idleTime >= this.config.logoutTime) {
      this.stop(); // Stop monitoring before logout
      if (this.callbacks.onIdleLogout) {
        this.callbacks.onIdleLogout(idleTime);
      }
    }
  }

  /**
   * Get current idle time in milliseconds
   */
  getIdleTime(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Reset the activity timer (e.g., when user clicks "Stay Logged In")
   */
  resetIdleTimer(): void {
    this.lastActivityTime = Date.now();
    this.warningShown = false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const activityMonitor = new ActivityMonitor();
