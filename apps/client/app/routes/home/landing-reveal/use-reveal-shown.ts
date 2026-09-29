import { useCallback, useSyncExternalStore } from 'react';
import { type Reveal, subscribeReveal } from './landing-reveal.utils';

export function useRevealShown( reveal: Reveal ): boolean {
    const subscribe = useCallback( ( notify: () => void ) => subscribeReveal( reveal, notify ), [ reveal ] );
    return useSyncExternalStore(
        subscribe,
        () => reveal.shown,
        () => false,
    );
}
