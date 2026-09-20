import { IsoLab } from '../../iso-lab/iso-lab';
import { BlockFamily } from './block-family';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Sealed block' } ];
}

/** `/iso-block` — art-pass task 7. Board 28 is the direction; board 10 and `handoff/04_OBSTACLES.md` are out. */
export default function IsoBlockRoute() {
    return (
        <IsoLab title="Sealed deadly block" size={ 8 } board="28_non_destructible_blocks_FINAL_DRAFT.png">
            <BlockFamily />
        </IsoLab>
    );
}
