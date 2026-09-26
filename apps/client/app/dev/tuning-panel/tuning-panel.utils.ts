import { SKY_BAKE_KEYS, SKY_LIVE_KEYS, SKY_LOOK_KEYS, type SkyKey } from '../../game/scene/nebula-presets';
import { col, num, setCol, setNum } from '../tuning';
import { type ColorPath, NUMBER_TUNABLES, type NumberPath } from '../tuning-schema';

export function numberControl( path: NumberPath ) {
    const spec = NUMBER_TUNABLES[ path ];
    return {
        value: num( path ),
        min: spec.min,
        max: spec.max,
        step: spec.step,
        onChange: ( value: number ) => setNum( path, value ),
        transient: true as const,
    };
}

export function colorControl( path: ColorPath ) {
    return {
        value: col( path ),
        onChange: ( value: string ) => setCol( path, value ),
        transient: true as const,
    };
}

export function skyControls() {
    const keys: readonly SkyKey[] = [ ...SKY_BAKE_KEYS, ...SKY_LOOK_KEYS, ...SKY_LIVE_KEYS ];
    return Object.fromEntries( keys.map( ( key ) => [ key, numberControl( `Sky.${ key }` ) ] ) ) as Record<
        SkyKey,
        ReturnType< typeof numberControl >
    >;
}
