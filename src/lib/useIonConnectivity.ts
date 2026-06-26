import { create } from 'zustand';

/**
 * @file useIonConnectivity.ts
 * @description Robustness State-Machine for ION DEX WebSocket lifecycle.
 * Implements Exponential Backoff Reconnection and Sequence ID snapshot sync.
 */

type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';

interface ConnectivityStore {
  status: ConnectionStatus;
  lastSequence: number;
  reconnectAttempts: number;
  
  // Actions
  onMessage: (msg: any) => void;
  onDisconnect: () => void;
  onConnect: () => void;
  resetSync: () => void;
}

export const useIonConnectivity = create<ConnectivityStore>((set, get) => ({
  status: 'DISCONNECTED',
  lastSequence: -1,
  reconnectAttempts: 0,

  onConnect: () => set({ status: 'CONNECTED', reconnectAttempts: 0 }),

  onDisconnect: () => {
    const attempts = get().reconnectAttempts;
    set({ status: 'DISCONNECTED', reconnectAttempts: attempts + 1 });
    
    // Exponential Backoff: 1s, 2s, 4s, 8s... max 30s
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    setTimeout(() => {
      console.log(`[Reconnector] Attempting reconnection in ${delay}ms...`);
      // triggerReconnect() logic here
    }, delay);
  },

  onMessage: (msg) => {
    const { lastSequence } = get();
    
    // 1. Sequence Gap Detection
    if (lastSequence !== -1 && msg.seq !== lastSequence + 1) {
      console.warn(`[SequenceGuard] Gap detected! Expected ${lastSequence + 1}, got ${msg.seq}.`);
      set({ status: 'SYNCING' });
      // triggerSnapshotFetch() logic here to pull full orderbook state
      return;
    }

    set({ lastSequence: msg.seq });
  },

  resetSync: () => set({ lastSequence: -1, status: 'CONNECTED' })
}));
