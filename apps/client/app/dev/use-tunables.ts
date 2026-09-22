import { useSyncExternalStore } from 'react';
import { rebuildToken, subscribeTunables, tunablesVersion } from './tunables';

export function useTunableVersion(): number {
    return useSyncExternalStore( subscribeTunables, tunablesVersion, tunablesVersion );
}

export function useRebuildToken(): number {
    return useSyncExternalStore( subscribeTunables, rebuildToken, rebuildToken );
}
