import type { Notebook, PageMetadata } from './types';

const STORAGE_KEY = 'omninotes_notebooks_v1';
const HISTORY_KEY = 'omninotes_history_v1';

export interface VersionSnapshot {
  pageId: string;
  timestamp: number;
  strokeCount: number;
  data: string; // JSON serialized page
}

export class StorageAdapter {
  /**
   * Save notebooks to local storage
   */
  public static saveNotebooks(notebooks: Notebook[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
    } catch (err) {
      console.error('Failed to save notebooks to localStorage', err);
    }
  }

  /**
   * Load notebooks from local storage
   */
  public static loadNotebooks(): Notebook[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Notebook[] = JSON.parse(data);
        // Detect legacy hardcoded demo notebooks
        const hasLegacyDemo = parsed.some(
          (nb) =>
            nb.title === 'Computer Science & Notes' ||
            nb.title === 'Personal Journal & Reflections' ||
            nb.sections.some((s) =>
              s.pages.some((p) => p.title === 'Architecture & System Design' || p.title === 'Daily Reflection')
            )
        );
        if (hasLegacyDemo) {
          // Filter out the demo notebooks
          const cleaned = parsed.filter(
            (nb) =>
              nb.title !== 'Computer Science & Notes' &&
              nb.title !== 'Personal Journal & Reflections'
          );
          if (cleaned.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
          }
          this.saveNotebooks(cleaned);
          return cleaned;
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to parse notebooks from localStorage', err);
    }
    return null;
  }

  /**
   * Save a snapshot into local version history
   */
  public static saveVersionSnapshot(page: PageMetadata): void {
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      const history: VersionSnapshot[] = historyStr ? JSON.parse(historyStr) : [];
      
      const newSnapshot: VersionSnapshot = {
        pageId: page.id,
        timestamp: Date.now(),
        strokeCount: page.strokes.length,
        data: JSON.stringify(page),
      };

      // Keep latest 25 snapshots across the app
      const updated = [newSnapshot, ...history.slice(0, 24)];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota warnings
    }
  }

  /**
   * Get version history for a specific page
   */
  public static getPageHistory(pageId: string): VersionSnapshot[] {
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      if (historyStr) {
        const history: VersionSnapshot[] = JSON.parse(historyStr);
        return history.filter((s) => s.pageId === pageId);
      }
    } catch {
      return [];
    }
    return [];
  }
}
