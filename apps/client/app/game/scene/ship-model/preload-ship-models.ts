import { useGLTF } from '@react-three/drei';
import { guardLfsPointer } from '../gltf-lfs-guard';
import { SHIP_VISUALS } from '../ship-visuals';

export function preloadShipModels(): void {
    for ( const v of Object.values( SHIP_VISUALS ) ) {
        useGLTF.preload( v.url, undefined, undefined, guardLfsPointer );
    }
}
