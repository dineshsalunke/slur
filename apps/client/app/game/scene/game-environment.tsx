import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import * as THREE from 'three';
import { BACKDROP_URL } from './backdrop';
import { DeepSpaceSky } from './deep-space-sky';
import { Monoliths } from './monoliths';
import { DEEP_SPACE } from './sky-config';

export function GameEnvironment( { track }: { track: Track } ) {
    const size = useThree( ( state ) => state.size );
    const map = useTexture( BACKDROP_URL );

    map.colorSpace = THREE.SRGBColorSpace;

    const image = map.image as { width?: number; height?: number } | undefined;
    const imageAspect = ( image?.width ?? 16 ) / ( image?.height ?? 9 );
    const viewAspect = size.width / size.height;
    const wide = viewAspect > imageAspect;
    const repeatX = wide ? 1 : viewAspect / imageAspect;
    const repeatY = wide ? imageAspect / viewAspect : 1;

    map.repeat.set( repeatX, repeatY );
    map.offset.set( ( 1 - repeatX ) / 2, ( 1 - repeatY ) / 2 );

    return (
        <Fragment>
            <primitive attach="background" object={ map } />
            <DeepSpaceSky config={ DEEP_SPACE } />
            <Monoliths track={ track } />
        </Fragment>
    );
}
