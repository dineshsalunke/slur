import { useSyncExternalStore } from 'react';
import { type Quality, quality, serverQuality, subscribeQuality } from './quality.state';

export function useQuality(): Quality {
    return useSyncExternalStore( subscribeQuality, quality, serverQuality );
}
