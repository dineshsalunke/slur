import { Stars } from '@react-three/drei';
import type * as THREE from 'three';
import type { SkyConfig } from './sky-config';
import { SkyFollow } from './sky-follow';

const STARS_RENDER_ORDER = -999;

function behindEverything( points: THREE.Points | null ): void {
    if ( ! points ) return;
    points.renderOrder = STARS_RENDER_ORDER;
    const material = points.material as THREE.Material;
    material.transparent = false;
    material.depthTest = false;
}

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
