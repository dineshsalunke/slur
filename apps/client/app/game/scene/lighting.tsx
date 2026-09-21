import { Fragment } from 'react';
import { useDebugTuning } from '../../dev/debug-tuning';
import { ColdKey } from './cold-key';

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
