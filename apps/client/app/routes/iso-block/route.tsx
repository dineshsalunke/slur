import { IsoLab } from '../../iso-lab/iso-lab';
import { BlockFamily } from './block-family';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Sealed block' } ];
}

export default function IsoBlockRoute() {
    return (
        <IsoLab title="Sealed deadly block" size={ 8 } board="28_non_destructible_blocks_FINAL_DRAFT.png">
            <BlockFamily />
        </IsoLab>
    );
}
