import { Fragment, useMemo } from 'react';
import * as THREE from 'three';
import { type SkyConfig, skyDirection } from './sky-config';

/** Lever arm for the light. Only its DIRECTION is used, so the number is arbitrary — big enough that the
 *  position reads as "out there" to anyone inspecting the scene graph. */
const LIGHT_DISTANCE = 1000;

/**
 * The scene's one real light, aimed down the sky's authored star bearing.
 *
 * The target is rendered explicitly because three takes the direction as `light.worldPosition -
 * target.worldPosition` and the default target sits at the WORLD origin — while this light rides `SkyFollow`,
 * so against a fixed origin its direction would swing over a race's 8000u of travel. As a sibling inside the
 * follow group both ends translate together and the direction is constant by construction.
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
