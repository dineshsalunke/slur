import { IsoLab } from '../../iso-lab/iso-lab';
import { PlaceholderMonolith } from './placeholder-monolith';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Monoliths' } ];
}

export default function IsoMonolithRoute() {
    return (
        <IsoLab title="Monoliths (placeholder)" size={ 300 } board="03_monoliths_final.png">
            <PlaceholderMonolith />
        </IsoLab>
    );
}
