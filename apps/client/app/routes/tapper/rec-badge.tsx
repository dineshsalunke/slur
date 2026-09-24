import { useSyncExternalStore } from 'react';
import { recStore } from './recorder';

const LABEL = { off: '', armed: 'REC armed · next pass', on: '● REC' } as const;

export function RecBadge() {
    const mode = useSyncExternalStore( recStore.subscribe, () => recStore.get().mode );
    return <span className="text-threat">{ LABEL[ mode ] }</span>;
}
