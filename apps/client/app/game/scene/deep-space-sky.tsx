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
 * ZERO PARALLAX, BY DESIGN — `SkyFollow` copies camera position but not rotation, so the sky swings as the
 * ship turns and never shifts as it travels. At a 64u strafe cap against cosmic distance there is no shift to
 * render, and camera-locked points cannot crawl. Depth is the job of the rock layers in front of the sky.
 */
export function DeepSpaceSky( {
    config,
    backdrop = true,
    light = true,
    environment = true,
    toneMapped = true,
}: {
    config: SkyConfig;
    /** Mount the visible sky patch. Split from `light`/`environment` so a review mode can hide the picture
     *  without unlighting the scene, which the labs have no lights of their own to survive. */
    backdrop?: boolean;
    /** Mount the scene's real `DirectionalLight`. The roughness self-test at `/iso-sky` needs this OFF —
     *  a star light lights those probes as happily as a rig light, so leaving it on proves nothing. */
    light?: boolean;
    /** Mount the `<Lightformer>` bake. Off is the other half of the same self-test. */
    environment?: boolean;
    /** Forwarded to the backdrop — see `SkyBackdrop`. */
    toneMapped?: boolean;
} ) {
    return (
        <Fragment>
            <SkyFollow>
                { backdrop ? (
                    <SkyBackdrop config={ config.backdrop } radius={ config.radius } toneMapped={ toneMapped } />
                ) : null }
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
