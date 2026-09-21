import { skyDirection } from './sky-config';

export const KEY_BEARING_DEG = 0;
export const KEY_ELEVATION_DEG = 45;
export const KEY_COLOR = '#c2ccd6';
export const KEY_INTENSITY = 1;

const LIGHT_DISTANCE = 1000;

export function ColdKey() {
    const [ x, y, z ] = skyDirection( KEY_BEARING_DEG, KEY_ELEVATION_DEG );

    return (
        <directionalLight
            position={ [ x * LIGHT_DISTANCE, y * LIGHT_DISTANCE, z * LIGHT_DISTANCE ] }
            intensity={ KEY_INTENSITY }
            color={ KEY_COLOR }
        />
    );
}
