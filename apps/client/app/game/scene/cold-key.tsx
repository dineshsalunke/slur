import { useDebugTuning } from '../../dev/debug-tuning';
import { skyDirection } from './sky-config';

export const KEY_BEARING_DEG = 0;
export const KEY_ELEVATION_DEG = 45;
export const KEY_COLOR = '#c2ccd6';
export const KEY_INTENSITY = 1;

const LIGHT_DISTANCE = 1000;

export function ColdKey() {
    const tuning = useDebugTuning();
    const dev = import.meta.env.DEV;
    const [ x, y, z ] = skyDirection(
        dev ? tuning.keyBearing : KEY_BEARING_DEG,
        dev ? tuning.keyElevation : KEY_ELEVATION_DEG,
    );

    return (
        <directionalLight
            position={ [ x * LIGHT_DISTANCE, y * LIGHT_DISTANCE, z * LIGHT_DISTANCE ] }
            intensity={ dev ? tuning.keyIntensity : KEY_INTENSITY }
            color={ KEY_COLOR }
        />
    );
}
