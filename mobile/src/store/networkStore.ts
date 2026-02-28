import { useEffect } from 'react';
import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { crossAlert } from '../utils/alert';

const OFFLINE_VOTES_KEY = 'offlineVotesQueue';

interface QueuedVote {
  eventId: string;
  trackId: string;
}

interface NetworkState {
  isConnected: boolean;
  setConnected: (value: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  setConnected: (value) => set({ isConnected: value }),
}));

export async function getOfflineVotes(): Promise<QueuedVote[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_VOTES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function queueOfflineVote(vote: QueuedVote) {
  const queue = await getOfflineVotes();
  queue.push(vote);
  await AsyncStorage.setItem(OFFLINE_VOTES_KEY, JSON.stringify(queue));
}

async function syncOfflineVotes() {
  const queue = await getOfflineVotes();
  if (queue.length === 0) return;

  let synced = 0;
  for (const vote of queue) {
    try {
      await api.post(`/events/${vote.eventId}/tracks/${vote.trackId}/vote`);
      synced++;
    } catch {
      // Track or event might have been deleted — drop this vote silently
    }
  }

  await AsyncStorage.removeItem(OFFLINE_VOTES_KEY);

  if (synced > 0) {
    crossAlert('Sync', `${synced} vote(s) hors-ligne synchronise(s)`);
  }
}

// Hook to subscribe to network changes + trigger sync on reconnect
export function useNetworkListener() {
  const setConnected = useNetworkStore(s => s.setConnected);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      const wasOffline = !useNetworkStore.getState().isConnected;

      setConnected(online);

      if (online && wasOffline) {
        syncOfflineVotes();
      }
    });

    return () => unsubscribe();
  }, [setConnected]);
}
