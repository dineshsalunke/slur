import { IsoLab } from '../../iso-lab/iso-lab';
import { PlaceholderMonolith } from './placeholder-monolith';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Monoliths' } ];
}

/**
 * `/iso-monolith` — the exemplar `/iso-*` route, and the template for every ingredient lane.
 *
 * A whole ingredient route is this file plus one line in `routes.ts`. The subject inside is a deliberate
 * PLACEHOLDER (see `placeholder-monolith.tsx`) — this lane built the instrument, not the monoliths.
 */
export default function IsoMonolithRoute() {
    return (
        <IsoLab title="Monoliths (placeholder)" size={ 300 } board="03_monoliths_final.png">
            <PlaceholderMonolith />
        </IsoLab>
    );
}
