import { Fragment } from 'react';
import { SealedBlock } from '../../game/scene/sealed-block';

/**
 * Three LEGAL footprints, at true scale, 8u tall each. `4 × 8` is what today's generator emits; the other
 * two are GDD §0's own examples of legal blocks, so the family is demonstrated on sizes the spatial
 * contract blesses rather than sizes this lane invented.
 */
const FAMILY = [
    { w: 4, d: 8, x: 0 },
    { w: 5.5, d: 5.5, x: 8 },
    { w: 3.5, d: 5, x: 15 },
] as const;

export function BlockFamily() {
    return (
        <Fragment>
            { FAMILY.map( ( b ) => (
                <SealedBlock key={ b.x } w={ b.w } d={ b.d } x={ b.x } />
            ) ) }
        </Fragment>
    );
}
