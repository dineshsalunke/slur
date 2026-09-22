import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const SET = '/textures/metal/Metal046B_1K-JPG_';

export const SEALED_BLOCK_MAP_URLS = {
    map: `${ SET }Color.jpg`,
    normalMap: `${ SET }NormalGL.jpg`,
    roughnessMap: `${ SET }Roughness.jpg`,
    metalnessMap: `${ SET }Metalness.jpg`,
};

export const SEALED_BLOCK_TEXTURE_SPAN = 2;

export interface SealedBlockMaps {
    map: THREE.Texture;
    normalMap: THREE.Texture;
    roughnessMap: THREE.Texture;
    metalnessMap: THREE.Texture;
}

const ANISOTROPY = 8;

function configure( tex: THREE.Texture, colorSpace: THREE.ColorSpace ): THREE.Texture {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = ANISOTROPY;
    tex.colorSpace = colorSpace;
    return tex;
}

export function useSealedBlockMaps(): SealedBlockMaps {
    const maps = useTexture( SEALED_BLOCK_MAP_URLS ) as SealedBlockMaps;

    configure( maps.map, THREE.SRGBColorSpace );
    configure( maps.normalMap, THREE.NoColorSpace );
    configure( maps.roughnessMap, THREE.NoColorSpace );
    configure( maps.metalnessMap, THREE.NoColorSpace );

    return maps;
}
