import { Stars } from '@react-three/drei';
import type { SkyConfig } from '../sky-config';
import { SkyFollow } from '../sky-follow';
import { behindEverything } from './deep-space-sky.utils';

export function DeepSpaceSky( { config }: { config: SkyConfig } ) {
    if ( ! config.stars.enabled ) return null;

    return (
        <SkyFollow>
            <Stars
                ref={ behindEverything }
                radius={ config.stars.radius }
                depth={ config.stars.depth }
                count={ config.stars.count }
                factor={ config.stars.size }
                saturation={ config.stars.saturation }
                fade={ config.stars.fade }
                speed={ config.stars.twinkleSpeed }
            />
        </SkyFollow>
    );
}
