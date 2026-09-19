import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SkyBackdropConfig } from './sky-config';

/** Where the reference image lives. The boards were composed over this file, which is the whole reason it is
 *  the display sky rather than an approximation of one. */
export const BACKDROP_URL = '/textures/nebula-backdrop.jpg';

const DEGREES_PER_RADIAN = 180 / Math.PI;
/** Alpha-map resolution. It is two smoothsteps — anything sharper than this is wasted memory. */
const FADE_TEXELS = 128;

/**
 * The border fade, as an `alphaMap` rather than a shader.
 *
 * `meshBasicMaterial` has no edge-falloff of its own, and the three ways to add one were: patch the stock
 * material via `onBeforeCompile`, write a `ShaderMaterial` (which is the thing this whole pivot deleted), or
 * hand the stock material a generated alpha texture. The third keeps the material stock and the shader count
 * at zero, which is the point. Fade widths differ per axis because they are authored in DEGREES and the patch
 * is wider than it is tall.
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
 *
 * WHY A PATCH AND NOT THE OBVIOUS THINGS. `scene.background = texture` is a static fullscreen fill that does
 * not rotate when the camera yaws, so the "infinitely distant" sky would slide with the ship's heading; that
 * is what `scene-backdrop.tsx` did and why it is retired. A stock sphere is worse than it looks: a sphere's
 * DEFAULT UVs are equirectangular, so mapping a 16:9 framed composition onto one wraps it 360°×180° and smears
 * the planet across the poles. A framed image covers a CONE, and `sphereGeometry`'s `phiLength`/`thetaLength`
 * cut exactly that cone out of the sphere with UVs already running 0–1 across it.
 *
 * ⚠ `phiLength` IS NEGATIVE, on purpose. three sweeps `x = -cos(phi)`, so phi ascending runs the image's left
 * edge toward world −X — and world −X is SCREEN-right for a camera aimed down +Z (see `skyDirection`). Running
 * phi backwards puts image-left on screen-left. That reverses the face winding, which is why the material is
 * `DoubleSide`: the alternative is reasoning about which way the normals ended up pointing, and on this repo
 * that reasoning has been wrong before (`concave-outline-normals-from-winding`). A one-patch unlit backdrop
 * does not care.
 *
 * Vertical extent is NOT authored — it follows from the image's own aspect ratio. Stretching a framed
 * composition to fill a taller patch is the distortion the patch exists to avoid.
 */
export function SkyBackdrop( {
    config,
    radius,
    toneMapped = true,
}: {
    config: SkyBackdropConfig;
    radius: number;
    /** Exposed because it is a genuine eye call: `false` shows the reference ungraded (and the definition of
     *  done is "it IS the reference"), `true` puts it in the same tonal world as everything else in frame. */
    toneMapped?: boolean;
} ) {
    const map = useTexture( BACKDROP_URL );
    map.colorSpace = THREE.SRGBColorSpace;
    // The patch never tiles, and the default RepeatWrapping makes the edge texels bleed across to the far side
    // once the alpha fade starts sampling outside 0–1.
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;

    // `Texture.image` is untyped in three — it holds whatever the loader produced. `useTexture` suspends until
    // the load resolves, so for a jpg it is an ImageBitmap and the dimensions are there; the fallback is for
    // the type system, not for a case that happens.
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
