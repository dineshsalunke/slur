import { Environment, Lightformer } from '@react-three/drei';
import type { SkyConfig } from './sky-config';
import { skyDirection } from './sky-config';

const DEGREES_PER_RADIAN = 180 / Math.PI;
const CARD_DISTANCE = 10;

function cardScale( sizeDeg: number ): number {
    return 2 * CARD_DISTANCE * Math.tan( sizeDeg / 2 / DEGREES_PER_RADIAN );
}

function place( bearingDeg: number, elevationDeg: number ): [ number, number, number ] {
    const [ x, y, z ] = skyDirection( bearingDeg, elevationDeg );
    return [ x * CARD_DISTANCE, y * CARD_DISTANCE, z * CARD_DISTANCE ];
}

export function SkyEnvironment( { config }: { config: SkyConfig } ) {
    const env = config.environment;
    return (
        <Environment frames={ 1 } resolution={ env.resolution } background={ false }>
            <Lightformer
                form="rect"
                intensity={ env.keyIntensity }
                color={ env.keyColor }
                position={ place( config.starBearingDeg, config.starElevationDeg ) }
                scale={ cardScale( env.keySizeDeg ) }
                target={ [ 0, 0, 0 ] }
            />
            <Lightformer
                form="rect"
                intensity={ env.fillIntensity }
                color={ env.fillColor }
                position={ place( config.starBearingDeg + 180, -config.starElevationDeg ) }
                scale={ cardScale( env.keySizeDeg * 1.5 ) }
                target={ [ 0, 0, 0 ] }
            />
            <Lightformer
                form="ring"
                intensity={ env.ambientIntensity }
                color={ env.ambientColor }
                position={ [ 0, CARD_DISTANCE, 0 ] }
                scale={ cardScale( 150 ) }
                target={ [ 0, 0, 0 ] }
            />
        </Environment>
    );
}
