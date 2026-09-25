/**
 * Network & Wi-Fi Detection Utilities
 * Monitors online/offline status and connection type
 * Triggers sync only on Wi-Fi (not cellular)
 */

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown';
export type NetworkStatus = 'online' | 'offline';

export interface NetworkInfo {
  status: NetworkStatus;
  connectionType: ConnectionType;
  isWifi: boolean;
  isOnline: boolean;
  downlink?: number; // Mbps
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

class NetworkDetector {
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private currentStatus: NetworkInfo = {
    status: 'online',
    connectionType: 'unknown',
    isWifi: false,
    isOnline: true,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Listen to online/offline events
    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());

    // Listen to connection changes (on supported browsers)
    const connection = this.getConnection();
    if (connection) {
      connection.addEventListener('change', () => this.updateStatus());
    }

    // Initial status
    this.updateStatus();
  }

  private getConnection(): any {
    if (typeof navigator === 'undefined') return null;
    return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  }

  private updateStatus() {
    const status: NetworkStatus = navigator.onLine ? 'online' : 'offline';
    const connection = this.getConnection();

    let connectionType: ConnectionType = 'unknown';
    let effectiveType: NetworkInfo['effectiveType'];
    let downlink: number | undefined;

    if (connection) {
      const effectiveTypeValue = connection.effectiveType;
      if (effectiveTypeValue) {
        effectiveType = effectiveTypeValue;
      }

      const downlinkValue = connection.downlink;
      if (downlinkValue) {
        downlink = downlinkValue;
      }

      const type = connection.type;
      if (type) {
        switch (type) {
          case '4g':
          case '5g':
          case 'wifi':
            connectionType = 'wifi';
            break;
          case '3g':
          case '2g':
          case 'slow-2g':
          case 'cellular':
            connectionType = 'cellular';
            break;
          case 'ethernet':
            connectionType = 'ethernet';
            break;
          default:
            connectionType = 'unknown';
        }
      }
    }

    // Fallback: treat 'wifi' type as Wi-Fi
    if (connectionType === 'unknown' && typeof navigator !== 'undefined') {
      // On iOS, we can't directly detect Wi-Fi, so we assume if connected it's Wi-Fi
      // unless we know it's cellular
      if (status === 'online') {
        connectionType = 'wifi'; // Conservative assumption
      }
    }

    this.currentStatus = {
      status,
      connectionType,
      isWifi: connectionType === 'wifi' || connectionType === 'ethernet',
      isOnline: status === 'online',
      downlink,
      effectiveType,
    };

    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkInfo {
    return { ...this.currentStatus };
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Check if connected via Wi-Fi (not cellular)
   */
  isWifi(): boolean {
    return this.currentStatus.isWifi;
  }

  /**
   * Check if should sync (online AND on Wi-Fi or ethernet)
   */
  shouldSync(): boolean {
    return this.currentStatus.isOnline && this.currentStatus.isWifi;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: (info: NetworkInfo) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Wait for Wi-Fi connection (polls every 1 second)
   */
  async waitForWifi(timeoutMs: number = 30000): Promise<boolean> {
    if (this.shouldSync()) {
      return true;
    }

    return new Promise(resolve => {
      const startTime = Date.now();
      let unsubscribe: (() => void) | null = null;

      const checkTimeout = setInterval(() => {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkTimeout);
          if (unsubscribe) unsubscribe();
          resolve(false);
        }
      }, 1000);

      unsubscribe = this.subscribe(status => {
        if (status.isOnline && status.isWifi) {
          clearInterval(checkTimeout);
          if (unsubscribe) unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

// Singleton instance
let detectorInstance: NetworkDetector | null = null;

export function getNetworkDetector(): NetworkDetector {
  if (!detectorInstance) {
    detectorInstance = new NetworkDetector();
  }
  return detectorInstance;
}

// Convenience functions
export function isOnline(): boolean {
  return getNetworkDetector().isOnline();
}

export function isWifi(): boolean {
  return getNetworkDetector().isWifi();
}

export function shouldSync(): boolean {
  return getNetworkDetector().shouldSync();
}

export function getNetworkStatus(): NetworkInfo {
  return getNetworkDetector().getStatus();
}

export function subscribeToNetworkChanges(callback: (info: NetworkInfo) => void): () => void {
  return getNetworkDetector().subscribe(callback);
}

export async function waitForWifi(timeoutMs?: number): Promise<boolean> {
  return getNetworkDetector().waitForWifi(timeoutMs);
}
