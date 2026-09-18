import { Stars } from '@react-three/drei';
import type { Ref } from 'react';
import type * as THREE from 'three';
import { CelestialBody } from './celestial-body';
import { ProceduralDome } from './procedural-dome';
import type { SkyConfig } from './sky-config';
import { SkyFollow } from './sky-follow';
import { StarLight } from './star-light';

/**
 * The display half of the deep-space sky — the procedural dome plus the star field, riding `SkyFollow`.
 *
 * ZERO PARALLAX, BY DESIGN. `SkyFollow` copies camera POSITION but not rotation, so the sky swings as the ship
 * turns and never shifts as it travels. That is not an approximation of cosmic distance, it IS cosmic distance:
 * apparent shift is baseline ÷ distance, and both baselines here are tiny — lateral strafe is capped at 64u
 * (`halfWidth: 32`) and a whole race is 8000u of forward travel (`TRACK_SEGMENTS · SEG_LEN`). Depth is the job
 * of the rock layers in front of the sky, never the sky's. `SkyFollow` is therefore used UNCHANGED.
 *
 * Star-field stability falls out of the same property: camera-locked points have no sub-pixel motion at all, so
 * there is nothing to crawl or shimmer at race speed.
 */
export function ProceduralSky( {
    config,
    gain = 1,
    light = true,
    domeMaterialRef,
}: {
    config: SkyConfig;
    gain?: number;
    /**
     * Mount the scene's real `DirectionalLight`. On by default; OFF is what the slice-3 environment gate
     * needs. `/iso-sky` runs `rig={false}` specifically so that no neutral light can make the roughness
     * self-test pass on its own — and a star light lights those probes just as happily as a rig light does.
     * Whoever judges "is the bake lighting anything" has to switch this off first or the test proves nothing.
     */
    light?: boolean;
    /** Forwarded to the dome so `/iso-sky` can retune uniforms live. The game passes nothing. */
    domeMaterialRef?: Ref< THREE.ShaderMaterial >;
} ) {
    return (
        <SkyFollow>
            <ProceduralDome config={ config } gain={ gain } materialRef={ domeMaterialRef } />
            { config.body.enabled ? <CelestialBody config={ config } gain={ gain } /> : null }
            { light ? <StarLight config={ config } /> : null }
            { config.stars.enabled ? (
                <Stars
                    radius={ config.stars.radius }
                    depth={ config.stars.depth }
                    count={ config.stars.count }
                    factor={ config.stars.size }
                    saturation={ config.stars.saturation }
                    fade={ config.stars.fade }
                    speed={ config.stars.twinkleSpeed }
                />
            ) : null }
        </SkyFollow>
    );
}
