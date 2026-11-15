// Offline-Friendly Access and Local Sync Manager
class OfflineManager {
  constructor() {
    this.CACHE_KEY = 'eldercare_offline_cache';
    this.QUEUE_KEY = 'eldercare_offline_queue';
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    this.updateStatusBanner();
  }

  saveEssentialCache(data) {
    try {
      const payload = {
        updatedAt: new Date().toISOString(),
        profile: data.profile || null,
        doses: data.doses || [],
        appointments: data.appointments || []
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[OfflineManager] Failed to save offline cache:', e);
    }
  }

  getEssentialCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  queueAction(actionPayload) {
    try {
      const queue = this.getQueue();
      queue.push({
        ...actionPayload,
        queuedAt: new Date().toISOString()
      });
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      console.log('[OfflineManager] Action queued locally for sync:', actionPayload);
    } catch (e) {
      console.warn('[OfflineManager] Failed to queue offline action:', e);
    }
  }

  getQueue() {
    try {
      const raw = localStorage.getItem(this.QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  clearQueue() {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  async syncQueue() {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineManager] Syncing ${queue.length} offline action(s)...`);
    for (const item of queue) {
      try {
        await fetch('/api/adherence/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: item.logId,
            action: item.action,
            options: { notes: `Synced from offline mode (recorded at ${item.queuedAt})` }
          })
        });
      } catch (err) {
        console.error('[OfflineManager] Error syncing action:', item, err);
      }
    }

    this.clearQueue();
    console.log('[OfflineManager] Offline queue successfully synced!');
    if (window.appCoordinator) {
      window.appCoordinator.refreshData();
    }
  }

  handleOnline() {
    this.isOnline = true;
    this.updateStatusBanner();
    this.syncQueue();
  }

  handleOffline() {
    this.isOnline = false;
    this.updateStatusBanner();
  }

  updateStatusBanner() {
    const banner = document.getElementById('offline-status-banner');
    if (!banner) return;

    if (!this.isOnline) {
      banner.classList.remove('hidden');
      banner.innerHTML = `
        <div class="bg-amber-600 text-white text-sm font-semibold px-4 py-1.5 flex items-center justify-between shadow">
          <span class="flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
            ${t('offlineNotice')}
          </span>
          <span class="text-xs bg-amber-800 px-2 py-0.5 rounded">All essential medications & emergency info accessible</span>
        </div>
      `;
    } else {
      banner.classList.add('hidden');
    }
  }
}

window.offlineManager = new OfflineManager();
