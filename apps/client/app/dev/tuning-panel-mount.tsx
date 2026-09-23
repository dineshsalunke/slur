import { lazy, Suspense } from 'react';
import { usePanelShown } from './panel-visibility';

const TuningPanel = import.meta.env.DEV ? lazy( () => import( './tuning-panel' ) ) : null;

export function TuningPanelMount() {
    const shown = usePanelShown();

    if ( ! TuningPanel || ! shown ) return null;

    return (
        <Suspense fallback={ null }>
            <TuningPanel />
        </Suspense>
    );
}
