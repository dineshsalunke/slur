import type { RootState } from '@react-three/fiber';
import type { World } from 'koota';
import { BlendFunction, BloomEffect } from 'postprocessing';
import { num } from '../../../dev/tuning';
import { localBoostSurplus } from '../../camera/boost-surplus';
import { BoostBlurEffect } from '../boost-blur/boost-blur-effect';

export function createBoostBlur(): BoostBlurEffect {
    return new BoostBlurEffect();
}

export function updateBoostBlur( blur: BoostBlurEffect, world: World, state: RootState ): void {
    blur.strength = localBoostSurplus( world ) * num( 'Boost.blur' );
    if ( blur.strength > 0 ) blur.aimAhead( state.camera );
}

export function createBloom(): BloomEffect {
    return new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true } );
}

export function updateBloom( bloom: BloomEffect ): void {
    bloom.intensity = num( 'Bloom.intensity' );
    bloom.luminanceMaterial.threshold = num( 'Bloom.threshold' );
    bloom.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
}
