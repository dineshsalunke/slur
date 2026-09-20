import { IsoLab } from '../../iso-lab/iso-lab';
import { BlockFamily } from './block-family';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Sealed block' } ];
}

/** `/iso-block` — art-pass task 7. Board 10 is LOOK only: it depicts stacks the art excludes. */
export default function IsoBlockRoute() {
    return (
        <IsoLab title="Sealed deadly block" size={ 8 } board="10_obstacle_blocks_final.png">
            <BlockFamily />
        </IsoLab>
    );
}
