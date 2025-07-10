/**
 * OFFLINE STORAGE DISABLED
 * 
 * This file is a placeholder for the offline storage functionality that has been disabled.
 * The application will only store authentication data and will not store any problem or submission data locally.
 */

// Simple interface for the disabled state
interface DisabledOfflineData {
  disabled: boolean;
}

class OfflineStorageManager {
  /**
   * All methods return empty or default values since offline storage is disabled
   */
  
  async getOfflineData(): Promise<DisabledOfflineData> {
    return { disabled: true };
  }

  async syncWithServer(): Promise<boolean> {
    console.log('Offline storage is disabled');
      return false;
  }

  async hasPendingSyncData(): Promise<boolean> {
      return false;
  }

  async getPendingCounts(): Promise<{problems: number; submissions: number; deletions: number}> {
      return { problems: 0, submissions: 0, deletions: 0 };
  }
}

// Export singleton instance
export const offlineStorageManager = new OfflineStorageManager(); 
 
 
 