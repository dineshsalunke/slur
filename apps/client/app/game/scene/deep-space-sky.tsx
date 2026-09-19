import { Stars } from '@react-three/drei';
import { Fragment } from 'react';
import { SkyBackdrop } from './sky-backdrop';
import type { SkyConfig } from './sky-config';
import { SkyEnvironment } from './sky-environment';
import { SkyFollow } from './sky-follow';
import { StarLight } from './star-light';

/**
 * The deep-space sky: the reference image on a camera-locked patch, a star field, one real light, and an
 * authored lighting environment that is deliberately NOT the picture.
 *
 * ZERO PARALLAX, BY DESIGN. `SkyFollow` copies camera POSITION but not rotation, so the sky swings as the ship
 * turns and never shifts as it travels. That is not an approximation of cosmic distance, it IS cosmic distance:
 * apparent shift is baseline ÷ distance, and both baselines here are tiny — lateral strafe is capped at 64u
 * (`halfWidth: 32`) and a whole race is 8000u of forward travel (`TRACK_SEGMENTS · SEG_LEN`). Depth is the job
 * of the rock layers in front of the sky, never the sky's.
 *
 * Star-field stability falls out of the same property: camera-locked points have no sub-pixel motion at all, so
 * there is nothing to crawl or shimmer at race speed.
 */
export function DeepSpaceSky( {
    config,
    light = true,
    environment = true,
    toneMapped = true,
}: {
    config: SkyConfig;
    /**
     * Mount the scene's real `DirectionalLight`. On by default; OFF is what the environment gate needs.
     * `/iso-sky` runs the lab rig off so that no neutral light can make the roughness self-test pass on its
     * own — and a star light lights those probes just as happily as a rig light does. Whoever judges "is the
     * environment lighting anything" has to switch this off too or the test proves nothing.
     */
    light?: boolean;
    /** Mount the `<Lightformer>` bake. Off is the other half of the same self-test. */
    environment?: boolean;
    /** Forwarded to the backdrop — see `SkyBackdrop`. */
    toneMapped?: boolean;
} ) {
    return (
        <Fragment>
            <SkyFollow>
                <SkyBackdrop config={ config.backdrop } radius={ config.radius } toneMapped={ toneMapped } />
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
            { environment ? <SkyEnvironment config={ config } /> : null }
        </Fragment>
    );
}
