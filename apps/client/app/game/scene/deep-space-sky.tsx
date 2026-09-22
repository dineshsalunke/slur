import { Stars } from '@react-three/drei';
import { Fragment } from 'react';
import type { SkyConfig } from './sky-config';
import { SkyEnvironment } from './sky-environment';
import { SkyFollow } from './sky-follow';
import { StarLight } from './star-light';

export function DeepSpaceSky( {
    config,
    light = true,
    environment = true,
}: {
    config: SkyConfig;
    light?: boolean;
    environment?: boolean;
} ) {
    return (
        <Fragment>
            <SkyFollow>
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
