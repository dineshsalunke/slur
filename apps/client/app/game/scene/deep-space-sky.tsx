import { Stars } from '@react-three/drei';
import { Fragment } from 'react';
import { SkyBackdrop } from './sky-backdrop';
import type { SkyConfig } from './sky-config';
import { SkyEnvironment } from './sky-environment';
import { SkyFollow } from './sky-follow';
import { StarLight } from './star-light';

export function DeepSpaceSky( {
    config,
    backdrop = true,
    light = true,
    environment = true,
    toneMapped = true,
}: {
    config: SkyConfig;
    backdrop?: boolean;
    light?: boolean;
    environment?: boolean;
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
