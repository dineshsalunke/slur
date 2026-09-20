import { useDebugTuning } from '../../dev/debug-tuning';
import { skyDirection } from './sky-config';

// Bearing 0 aims down the track, where the backdrop image is centred — NOT the star's 66, which is
// already 86% of the way to screen-right and owns every one-sided term in the frame.
export const KEY_BEARING_DEG = 0;
export const KEY_ELEVATION_DEG = 45;
export const KEY_COLOR = '#c2ccd6';
/** Dialled on the live panel and committed verbatim. 99% of what it buys on the near-black deck
 *  is specular, so this number moves a sheen, not a black level. */
export const KEY_INTENSITY = 1;

const LIGHT_DISTANCE = 1000;

/** Static, unlike `StarLight`: it does not ride `SkyFollow`, so its position and three's default
 *  world-origin target are both fixed and the direction cannot swing over the race's 8000u. */
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
