import { Fragment } from 'react';
import { useDebugTuning } from '../../dev/debug-tuning';
import { ColdKey } from './cold-key';

/** Zero: "there is no fill" is the direction, and the white 1 only existed because nothing lit the deck.
 *  The slider survives so the A/B stays one drag away. */
export const AMBIENT_INTENSITY = 0;

export function SceneLighting() {
    const tuning = useDebugTuning();

    return (
        <Fragment>
            <ambientLight intensity={ import.meta.env.DEV ? tuning.ambientIntensity : AMBIENT_INTENSITY } />
            <ColdKey />
        </Fragment>
    );
}
