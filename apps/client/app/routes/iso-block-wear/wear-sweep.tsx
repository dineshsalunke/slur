import { Fragment } from 'react';
import { SealedBlock } from '../../game/scene/sealed-block';

/**
 * One footprint, one seed, three wear strengths — so the only thing changing across the row is the dial.
 * `0` is what ships: board 28 calls clean a legitimate endpoint, and the rig measurements say the presented
 * face has no light for wear to modulate anyway, so tuning waits on #170.
 */
const SWEEP = [ 0, 0.6, 1 ] as const;

export function WearSweep() {
    return (
        <Fragment>
            { SWEEP.map( ( strength, i ) => (
                <SealedBlock
                    key={ strength }
                    w={ 4 }
                    d={ 8 }
                    x={ ( i - 1 ) * 6 }
                    seed={ 0x5b10c }
                    wearStrength={ strength }
                />
            ) ) }
        </Fragment>
    );
}
