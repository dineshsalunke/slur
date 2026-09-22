import { Environment } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tunables';
import { useRebuildToken, useTunableVersion } from '../../dev/use-tunables';

const WIDTH = 128;
const HEIGHT = 64;

function gradientEnvironment(): THREE.DataTexture {
    const nadir = new THREE.Color( col( 'ibl.nadir' ) );
    const horizon = new THREE.Color( col( 'ibl.horizon' ) );
    const zenith = new THREE.Color( col( 'ibl.zenith' ) );
    const band = new THREE.Color();
    const data = new Uint16Array( WIDTH * HEIGHT * 4 );
    const alpha = THREE.DataUtils.toHalfFloat( 1 );

    for ( let y = 0; y < HEIGHT; y++ ) {
        const v = y / ( HEIGHT - 1 );
        if ( v < 0.5 ) band.copy( nadir ).lerp( horizon, v * 2 );
        else band.copy( horizon ).lerp( zenith, ( v - 0.5 ) * 2 );

        const r = THREE.DataUtils.toHalfFloat( band.r );
        const g = THREE.DataUtils.toHalfFloat( band.g );
        const b = THREE.DataUtils.toHalfFloat( band.b );

        for ( let x = 0; x < WIDTH; x++ ) {
            const i = ( y * WIDTH + x ) * 4;
            data[ i ] = r;
            data[ i + 1 ] = g;
            data[ i + 2 ] = b;
            data[ i + 3 ] = alpha;
        }
    }

    const texture = new THREE.DataTexture( data, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.HalfFloatType );
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

export function GradientIbl() {
    useTunableVersion();
    const rebuild = useRebuildToken();
    const texture = useMemo( gradientEnvironment, [ rebuild ] );

    // JUSTIFIED EFFECT — syncs with an external system: the GPU, which holds a texture React did not allocate and will not free.
    useEffect( () => () => texture.dispose(), [ texture ] );

    return <Environment map={ texture } environmentIntensity={ num( 'ibl.intensity' ) } />;
}
