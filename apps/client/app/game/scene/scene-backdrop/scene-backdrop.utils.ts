import * as THREE from 'three';
import { FALLBACK_ASPECT } from './scene-backdrop.constants';

export function prepareBackdrop( map: THREE.Texture ): void {
    map.colorSpace = THREE.SRGBColorSpace;
}

export function coverFit( map: THREE.Texture, viewAspect: number ): void {
    const image = map.image as { width?: number; height?: number } | undefined;
    const imageAspect = image?.width && image.height ? image.width / image.height : FALLBACK_ASPECT;
    const wide = viewAspect > imageAspect;
    const repeatX = wide ? 1 : viewAspect / imageAspect;
    const repeatY = wide ? imageAspect / viewAspect : 1;

    map.repeat.set( repeatX, repeatY );
    map.offset.set( ( 1 - repeatX ) / 2, ( 1 - repeatY ) / 2 );
    map.updateMatrix();
}

export function backdropUniforms( map: THREE.Texture ): Record< string, THREE.IUniform > {
    return {
        t2D: { value: map },
        uvTransform: { value: map.matrix },
        backgroundIntensity: { value: 1 },
    };
}
