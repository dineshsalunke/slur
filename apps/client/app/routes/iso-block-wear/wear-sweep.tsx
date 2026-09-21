import { Fragment } from 'react';
import { SealedBlock } from '../../game/scene/sealed-block';

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
