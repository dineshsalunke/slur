import { Environment, Lightformer } from '@react-three/drei';
import type { SkyConfig } from './sky-config';
import { skyDirection } from './sky-config';

const DEGREES_PER_RADIAN = 180 / Math.PI;
/** Distance the light cards sit at inside the bake's own little scene. Arbitrary — only the angles they
 *  subtend survive into the cubemap — so it exists purely to convert an authored angular size into a scale. */
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
 *
 * THIS IS THE POINT OF THE WHOLE PIVOT. `01-background/README.md` §2 framed a "central tension": the art wants
 * a near-black sky, but a near-black sky is a near-black light source, so the thing you see cannot also be the
 * thing that lights. That is only true if the light is derived FROM the picture. Author the two separately and
 * the tension evaporates — the backdrop can be as dark as the reference while the environment carries real
 * energy, because nothing forces them to be the same buffer.
 *
 * `frames={1}` bakes once and never again: the cards never move and the rig is static, so a per-frame re-bake
 * would cost a cubemap render every frame to reproduce an identical result.
 *
 * ⚠ `preset=` IS FORBIDDEN and always will be — it fetches an HDR from a CDN, and this game has to run on an
 * office LAN with no internet. The `children` path renders locally and ships nothing.
 *
 * Mounted OUTSIDE `SkyFollow` deliberately. `<Environment>` writes `scene.environment`; where its element sits
 * in the graph does not affect the bake, and parenting it to a group that rewrites its matrix every frame
 * invites exactly the kind of "why does the lighting drift" bug the `StarLight` target comment describes.
 */
export function SkyEnvironment( { config }: { config: SkyConfig } ) {
    const env = config.environment;
    return (
        <Environment frames={ 1 } resolution={ env.resolution } background={ false }>
            { /* KEY — the cold rim, on the star bearing, so the rock field's lit edge agrees with the
                 direction the reference image's own crescent implies. */ }
            <Lightformer
                form="rect"
                intensity={ env.keyIntensity }
                color={ env.keyColor }
                position={ place( config.starBearingDeg, config.starElevationDeg ) }
                scale={ cardScale( env.keySizeDeg ) }
                target={ [ 0, 0, 0 ] }
            />
            { /* FILL — opposite the key and far dimmer. Without it the unlit side of every rock is pure black,
                 which reads as a hole in the frame rather than as shadow. */ }
            <Lightformer
                form="rect"
                intensity={ env.fillIntensity }
                color={ env.fillColor }
                position={ place( config.starBearingDeg + 180, -config.starElevationDeg ) }
                scale={ cardScale( env.keySizeDeg * 1.5 ) }
                target={ [ 0, 0, 0 ] }
            />
            { /* AMBIENT WRAP — a big dim ring overhead. The "there is a galaxy out there" term; it is what
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
