/**
 * History Store
 *
 * Persists workflow session snapshots so users can review
 * and reload past diagnosis, strategy, and content results.
 *
 * Uses Zustand + localStorage (key: geo-hub-history).
 * Caps at 50 entries; oldest entries are evicted first.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry } from '../types';

const MAX_ENTRIES = 50;

interface HistoryState {
  entries: HistoryEntry[];
  /** Add or update an entry. If an entry with the same id exists, it is
   *  replaced (updatedAt refreshed). Otherwise prepended. */
  addEntry: (entry: HistoryEntry) => void;
  /** Remove a single entry by id. */
  deleteEntry: (id: string) => void;
  /** Remove all history entries. */
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const filtered = state.entries.filter((e) => e.id !== entry.id);
          const updated = [
            { ...entry, updatedAt: new Date().toISOString() },
            ...filtered,
          ].slice(0, MAX_ENTRIES);
          return { entries: updated };
        }),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'geo-hub-history',
    },
  ),
);
