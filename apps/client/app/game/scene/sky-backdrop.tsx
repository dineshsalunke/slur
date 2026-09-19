import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SkyBackdropConfig } from './sky-config';

/** The concept boards were composed over this image, so shipping it matches them by construction. */
export const BACKDROP_URL = '/textures/nebula-backdrop.jpg';

const DEGREES_PER_RADIAN = 180 / Math.PI;
/** Alpha-map resolution. It is two smoothsteps — anything sharper than this is wasted memory. */
const FADE_TEXELS = 128;

/**
 * The border fade as a generated `alphaMap`, which keeps `meshBasicMaterial` stock and the shader count at
 * zero — the alternatives were `onBeforeCompile` or a `ShaderMaterial`. Fade widths differ per axis because
 * they are authored in DEGREES and the patch is wider than it is tall.
 */
function makeEdgeFade( fadeU: number, fadeV: number ): THREE.DataTexture {
    const data = new Uint8Array( FADE_TEXELS * FADE_TEXELS * 4 );
    for ( let y = 0; y < FADE_TEXELS; y++ ) {
        for ( let x = 0; x < FADE_TEXELS; x++ ) {
            const u = ( x + 0.5 ) / FADE_TEXELS;
            const v = ( y + 0.5 ) / FADE_TEXELS;
            const du = Math.min( u, 1 - u );
            const dv = Math.min( v, 1 - v );
            const a = smoothstep( du / fadeU ) * smoothstep( dv / fadeV );
            const i = ( y * FADE_TEXELS + x ) * 4;
            data[ i ] = data[ i + 1 ] = data[ i + 2 ] = data[ i + 3 ] = Math.round( a * 255 );
        }
    }
    const tex = new THREE.DataTexture( data, FADE_TEXELS, FADE_TEXELS );
    tex.needsUpdate = true;
    return tex;
}

function smoothstep( t: number ): number {
    const c = Math.min( 1, Math.max( 0, t ) );
    return c * c * ( 3 - 2 * c );
}

/**
 * `nebula-backdrop.jpg` hung on a spherical PATCH of authored angular size — the display half of the sky.
 * `sphereGeometry`'s `phiLength`/`thetaLength` cut out the cone a framed image actually covers, with UVs
 * already 0–1 across it; `scene.background` cannot yaw with the camera and a stock sphere's equirectangular
 * UVs smear the planet across the poles. Vertical extent follows the image's aspect and is never authored.
 *
 * ⚠ `phiLength` IS NEGATIVE on purpose: three sweeps `x = -cos(phi)`, so ascending phi runs image-left toward
 * world −X, which is SCREEN-right. Running it backwards puts image-left on screen-left. That reverses the
 * face winding, hence `DoubleSide` — cheaper than reasoning about which way the normals ended up pointing.
 */
export function SkyBackdrop( {
    config,
    radius,
    toneMapped = true,
}: {
    config: SkyBackdropConfig;
    radius: number;
    /** A genuine eye call: `false` shows the reference ungraded, `true` puts it in the same tonal world as
     *  everything else in frame. */
    toneMapped?: boolean;
} ) {
    const map = useTexture( BACKDROP_URL );
    map.colorSpace = THREE.SRGBColorSpace;
    // The patch never tiles, and the default RepeatWrapping bleeds edge texels across to the far side once
    // the alpha fade samples outside 0–1.
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;

    // `Texture.image` is untyped in three. `useTexture` suspends until the load resolves, so the dimensions
    // are always there and the fallback is for the type system, not for a case that happens.
    const image = map.image as { width?: number; height?: number } | undefined;
    const aspect = ( image?.width ?? 16 ) / ( image?.height ?? 9 );
    const fovVDeg = config.fovDeg / aspect;

    const alphaMap = useMemo(
        () => makeEdgeFade( config.edgeFadeDeg / config.fovDeg, config.edgeFadeDeg / fovVDeg ),
        [ config.edgeFadeDeg, config.fovDeg, fovVDeg ],
    );

    const halfPhi = config.fovDeg / 2 / DEGREES_PER_RADIAN;
    const halfTheta = fovVDeg / 2 / DEGREES_PER_RADIAN;
    const bearing = config.bearingDeg / DEGREES_PER_RADIAN;
    const elevation = config.elevationDeg / DEGREES_PER_RADIAN;

    return (
        <mesh renderOrder={ -1 }>
            <sphereGeometry
                args={ [
                    radius,
                    64,
                    48,
                    Math.PI / 2 - bearing + halfPhi,
                    -2 * halfPhi,
                    Math.PI / 2 - halfTheta - elevation,
                    2 * halfTheta,
                ] }
            />
            { /* `color` MULTIPLIES `map`, so gain rides it and stays a plain data knob. `depthWrite={false}`
                 plus `renderOrder={-1}`: the sky is behind everything by construction, not by distance. */ }
            <meshBasicMaterial
                map={ map }
                alphaMap={ alphaMap }
                transparent
                depthWrite={ false }
                side={ THREE.DoubleSide }
                toneMapped={ toneMapped }
                color={ new THREE.Color( config.gain, config.gain, config.gain ) }
            />
        </mesh>
    );
}
