import { create } from 'zustand';
import type { TVState, MediaCell } from '../../../../packages/shared/src/types';
import { getTV, updateTV } from '../services/api';

interface TVStore {
  tvStates: Record<string, TVState>;
  loading: boolean;

  fetchTVState: (tvId: string) => Promise<void>;
  setLayout: (tvId: string, layoutId: string, cellCount: number) => Promise<void>;
  setMedia: (tvId: string, cellIndex: number, mediaUrl: string, mediaType: 'image' | 'video') => Promise<void>;
  clearTV: (tvId: string) => Promise<void>;
}

export const useTVStore = create<TVStore>((set, get) => ({
  tvStates: {},
  loading: false,

  fetchTVState: async (tvId) => {
    const state = await getTV(tvId);
    if (state) {
      set(prev => ({ tvStates: { ...prev.tvStates, [tvId]: state } }));
    }
  },

  setLayout: async (tvId, layoutId, cellCount) => {
    const cells: MediaCell[] = Array.from({ length: cellCount }, () => ({
      mediaUrl: null,
      mediaType: null,
    }));
    const newState: TVState = { tvId, layoutId, cells, updatedAt: Date.now() };

    // Optimistic update
    set(prev => ({ tvStates: { ...prev.tvStates, [tvId]: newState } }));

    // Save to backend (DynamoDB + IoT)
    await updateTV(tvId, layoutId, cells);
  },

  setMedia: async (tvId, cellIndex, mediaUrl, mediaType) => {
    const current = get().tvStates[tvId];
    if (!current) return;

    const cells = current.cells.map((c, i) =>
      i === cellIndex ? { mediaUrl, mediaType } : c
    );
    const newState = { ...current, cells, updatedAt: Date.now() };

    // Optimistic update
    set(prev => ({ tvStates: { ...prev.tvStates, [tvId]: newState } }));

    // Save to backend
    await updateTV(tvId, current.layoutId!, cells);
  },

  clearTV: async (tvId) => {
    const current = get().tvStates[tvId];
    if (!current) return;
    const cells = current.cells.map(() => ({ mediaUrl: null, mediaType: null }));
    const newState = { ...current, cells, updatedAt: Date.now() };
    set(prev => ({ tvStates: { ...prev.tvStates, [tvId]: newState } }));
    await updateTV(tvId, current.layoutId!, cells);
  },
}));
