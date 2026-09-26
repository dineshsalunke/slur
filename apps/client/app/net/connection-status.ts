import { useSyncExternalStore } from 'react';

export type ConnectionStatus = 'live' | 'reconnecting' | 'lost';

let status: ConnectionStatus = 'live';
const listeners = new Set< () => void >();

export function connectionStatus(): ConnectionStatus {
    return status;
}

export function setConnectionStatus( next: ConnectionStatus ): void {
    if ( next === status ) return;
    status = next;
    for ( const notify of listeners ) notify();
}

function subscribe( notify: () => void ): () => void {
    listeners.add( notify );
    return () => listeners.delete( notify );
}

export function useConnectionStatus(): ConnectionStatus {
    return useSyncExternalStore( subscribe, connectionStatus, connectionStatus );
}
