import { IsoLab } from '../../iso-lab/iso-lab';
import { WearSweep } from './wear-sweep';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Sealed block wear' } ];
}

/** `/iso-block-wear` — one footprint, one variable: how far the wear patches are pushed. Shipped value is 0. */
export default function IsoBlockWearRoute() {
    return (
        <IsoLab title="Sealed block — wear sweep" size={ 8 } board="28_non_destructible_blocks_FINAL_DRAFT.png">
            <WearSweep />
        </IsoLab>
    );
}
