import { useSyncExternalStore } from 'react';
import { rebuildToken, subscribeRebuild } from './tuning-rebuild';

export function useRebuildToken(): number {
    return useSyncExternalStore( subscribeRebuild, rebuildToken, rebuildToken );
}
