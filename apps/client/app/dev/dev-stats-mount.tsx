import { lazy, Suspense } from 'react';

const DevStats = import.meta.env.DEV ? lazy( () => import( './dev-stats' ) ) : null;

export function DevStatsMount() {
    if ( ! DevStats ) return null;

    return (
        <Suspense fallback={ null }>
            <DevStats />
        </Suspense>
    );
}
