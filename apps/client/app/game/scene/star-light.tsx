import { Fragment, useMemo } from 'react';
import * as THREE from 'three';
import { type SkyConfig, skyDirection } from './sky-config';

const LIGHT_DISTANCE = 1000;

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
