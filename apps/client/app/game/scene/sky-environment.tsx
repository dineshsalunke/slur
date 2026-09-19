import { Environment, Lightformer } from '@react-three/drei';
import type { SkyConfig } from './sky-config';
import { skyDirection } from './sky-config';

const DEGREES_PER_RADIAN = 180 / Math.PI;
/** Distance the cards sit at inside the bake's own scene. Arbitrary: only the angles they subtend survive
 *  into the cubemap, so this exists to turn an authored angular size into a scale. */
const CARD_DISTANCE = 10;

/** Angular size → card edge length at `CARD_DISTANCE`. */
function cardScale( sizeDeg: number ): number {
    return 2 * CARD_DISTANCE * Math.tan( sizeDeg / 2 / DEGREES_PER_RADIAN );
}

function place( bearingDeg: number, elevationDeg: number ): [ number, number, number ] {
    const [ x, y, z ] = skyDirection( bearingDeg, elevationDeg );
    return [ x * CARD_DISTANCE, y * CARD_DISTANCE, z * CARD_DISTANCE ];
}

/**
 * The scene's image-based lighting — three soft cards baked to a cubemap, and NOT the picture behind them.
 * The art wants a near-black sky, which is a near-black light source, so authoring the light separately is
 * what lets the backdrop stay as dark as the reference while the environment still carries energy.
 *
 * `frames={1}` bakes once: the rig is static, so a re-bake every frame reproduces an identical cubemap.
 *
 * ⚠ `preset=` IS FORBIDDEN — it fetches an HDR from a CDN, and this game has to run on an office LAN with no
 * internet. Mounted OUTSIDE `SkyFollow`, because parenting the bake to a group that rewrites its matrix every
 * frame is how the lighting starts drifting.
 */
export function SkyEnvironment( { config }: { config: SkyConfig } ) {
    const env = config.environment;
    return (
        <Environment frames={ 1 } resolution={ env.resolution } background={ false }>
            { /* KEY — the cold rim, on the star bearing, so the rock field's lit edge agrees with the
                 direction the reference image's crescent implies. */ }
            <Lightformer
                form="rect"
                intensity={ env.keyIntensity }
                color={ env.keyColor }
                position={ place( config.starBearingDeg, config.starElevationDeg ) }
                scale={ cardScale( env.keySizeDeg ) }
                target={ [ 0, 0, 0 ] }
            />
            { /* FILL — opposite the key and far dimmer. Without it an unlit rock face is pure black, which
                 reads as a hole in the frame rather than as shadow. */ }
            <Lightformer
                form="rect"
                intensity={ env.fillIntensity }
                color={ env.fillColor }
                position={ place( config.starBearingDeg + 180, -config.starElevationDeg ) }
                scale={ cardScale( env.keySizeDeg * 1.5 ) }
                target={ [ 0, 0, 0 ] }
            />
            { /* AMBIENT WRAP — a big dim ring overhead, the "there is a galaxy out there" term. It is what
                 stops the two cards reading as a photography studio. */ }
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
