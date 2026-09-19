import { Fragment, useMemo } from 'react';
import * as THREE from 'three';
import { type SkyConfig, skyDirection } from './sky-config';

/** Lever arm for the light. Only its DIRECTION is used, so this number is arbitrary — it just has to be big
 *  enough that the position reads as "out there" to anyone inspecting the scene graph. */
const LIGHT_DISTANCE = 1000;

/**
 * The scene's one real light, aimed down the sky's authored star bearing.
 *
 * WHY THE TARGET IS RENDERED EXPLICITLY: three derives a directional light's direction as
 * `light.worldPosition - light.target.worldPosition`, and the default target sits at the WORLD origin. This
 * light rides `SkyFollow`, so its world position is `camera + offset` — against a fixed origin the direction
 * would swing through a wide arc over a race's 8000u of forward travel. Rendering the target as a sibling
 * inside the same follow group makes both ends translate together, so the direction is constant by
 * construction rather than by being far enough away to hide the drift.
 */
export function StarLight( { config }: { config: SkyConfig } ) {
    const target = useMemo( () => new THREE.Object3D(), [] );
    const [ x, y, z ] = skyDirection( config.starBearingDeg, config.starElevationDeg );

    return (
        <Fragment>
            <primitive object={ target } />
            <directionalLight
                position={ [ x * LIGHT_DISTANCE, y * LIGHT_DISTANCE, z * LIGHT_DISTANCE ] }
                target={ target }
                intensity={ config.starLight.intensity }
                color={ config.starLight.color }
            />
        </Fragment>
    );
}
