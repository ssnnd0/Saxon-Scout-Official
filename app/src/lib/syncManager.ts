import { isOnline } from './dataSync';

/**
 * SyncManager handles background synchronization of offline data
 * It processes the pending sync queue when the device comes online
 */
export class SyncManager {
  private static instance: SyncManager;
  private syncInProgress: boolean = false;
  private syncInterval: number | null = null;

  private constructor() {
    // Initialize listeners
    this.setupEventListeners();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Set up event listeners for online/offline events
   */
  private setupEventListeners(): void {
    // When device comes online, attempt to sync
    window.addEventListener('online', () => {
      console.log('Device is online, attempting to sync pending data');
      this.syncPendingData();
    });

    // Start periodic sync check (every 5 minutes)
    this.startPeriodicSync(5 * 60 * 1000);
  }

  /**
   * Start periodic sync check
   */
  private startPeriodicSync(interval: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      this.checkAndSync();
    }, interval);
  }

  /**
   * Check if online and sync if needed
   */
  private async checkAndSync(): Promise<void> {
    const online = await isOnline();
    if (online) {
      this.syncPendingData();
    }
  }

  /**
   * Process the pending sync queue
   */
  public async syncPendingData(): Promise<void> {
    // Prevent multiple syncs from running simultaneously
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return;
    }

    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, cannot sync');
      return;
    }

    try {
      this.syncInProgress = true;
      
      // Get pending syncs from localStorage
      const pendingSyncsRaw = localStorage.getItem('saxon-scout-pending-syncs');
      if (!pendingSyncsRaw) {
        console.log('No pending syncs found');
        return;
      }

      const pendingSyncs = JSON.parse(pendingSyncsRaw);
      if (!Array.isArray(pendingSyncs) || pendingSyncs.length === 0) {
        console.log('No pending syncs to process');
        return;
      }

      console.log(`Found ${pendingSyncs.length} items to sync`);
      
      // Process each pending sync
      const successfulSyncs = [];
      const failedSyncs = [];

      for (const item of pendingSyncs) {
        try {
          // Determine endpoint based on type
          const endpoint = item.type === 'match' 
            ? '/api/scouting/matches' 
            : '/api/scouting/pit';
          
          // Attempt to read the file from local storage
          // This would need to be adapted based on how you're storing the data
          const fileData = await this.readLocalFile(item.path);
          
          if (!fileData) {
            console.warn(`Could not read local file: ${item.path}`);
            failedSyncs.push(item);
            continue;
          }
          
          // Send to server
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fileData)
          });
          
          if (response.ok) {
            console.log(`Successfully synced: ${item.path}`);
            successfulSyncs.push(item);
            
            // Update local file to mark as synced
            await this.updateLocalFileSyncStatus(item.path, true);
          } else {
            console.warn(`Failed to sync: ${item.path}, status: ${response.status}`);
            failedSyncs.push(item);
          }
        } catch (error) {
          console.error(`Error syncing item ${item.path}:`, error);
          failedSyncs.push(item);
        }
      }
      
      // Update the pending syncs list
      localStorage.setItem('saxon-scout-pending-syncs', JSON.stringify(failedSyncs));
      
      // Show notification if any syncs were successful
      if (successfulSyncs.length > 0) {
        this.showSyncNotification(successfulSyncs.length, failedSyncs.length);
      }
      
      console.log(`Sync complete. Success: ${successfulSyncs.length}, Failed: ${failedSyncs.length}`);
    } catch (error) {
      console.error('Error during sync process:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Read a local file (implementation depends on your storage method)
   */
  private async readLocalFile(path: string): Promise<any> {
    // This is a placeholder - actual implementation would depend on how you're storing files
    // For example, using the File System Access API or IndexedDB
    
    // For localStorage fallback implementation
    const key = 'saxon_scout_fs/' + path;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
  /**
   * Update the sync status of a local file
   */
  private async updateLocalFileSyncStatus(path: string, synced: boolean): Promise<void> {
    // This is a placeholder - actual implementation would depend on how you're storing files
    try {
      const key = 'saxon_scout_fs/' + path;
      const dataRaw = localStorage.getItem(key);
      if (dataRaw) {
        const data = JSON.parse(dataRaw);
        if (data._meta) {
          data._meta.syncedToServer = synced;
          data._meta.pendingSync = false;
        } else {
          data._meta = { syncedToServer: synced, pendingSync: false };
        }
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }
  
  /**
   * Show a notification about sync results
   */
  private showSyncNotification(successCount: number, failCount: number): void {
    // Create and dispatch a custom event that the UI can listen for
    const event = new CustomEvent('saxon-scout:sync-complete', {
      detail: { successCount, failCount }
    });
    window.dispatchEvent(event);
    
    // If the browser supports notifications and permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Saxon Scout Sync', {
        body: `Successfully synced ${successCount} items. ${failCount > 0 ? `${failCount} items failed.` : ''}`,
        icon: '/favicon.ico'
      });
    }
  }
}

// Initialize the sync manager
export const syncManager = SyncManager.getInstance();

// Export a function to manually trigger sync
export function triggerSync(): Promise<void> {
  return syncManager.syncPendingData();
}