import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { SkyBackdropConfig } from './sky-config';

export const BACKDROP_URL = '/textures/nebula-backdrop.jpg';

const DEGREES_PER_RADIAN = 180 / Math.PI;
const FADE_TEXELS = 128;

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

export function SkyBackdrop( {
    config,
    radius,
    toneMapped = true,
}: {
    config: SkyBackdropConfig;
    radius: number;
    toneMapped?: boolean;
} ) {
    const map = useTexture( BACKDROP_URL );
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;

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
