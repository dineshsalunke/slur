import { Stars } from '@react-three/drei';
import { Fragment } from 'react';
import type { EnvConfig } from './env-config';
import { GradientDome } from './gradient-dome';
import { SkyFollow } from './sky-follow';
import { TubeWalls } from './tube-walls';

export function Environment( { config, seed }: { config: EnvConfig; seed?: number } ) {
    return (
        <Fragment>
            <color attach="background" args={ [ config.background ] } />
            <fog attach="fog" args={ [ config.fog.color, config.fog.near, config.fog.far ] } />

            <SkyFollow>
                { config.dome.enabled ? <GradientDome config={ config.dome } /> : null }
                { config.stars.enabled ? (
                    <Stars
                        radius={ config.stars.radius }
                        depth={ config.stars.depth }
                        count={ config.stars.count }
                        factor={ config.stars.factor }
                        saturation={ config.stars.saturation }
                        fade={ config.stars.fade }
                        speed={ config.stars.speed }
                    />
                ) : null }
            </SkyFollow>

            <TubeWalls config={ config.walls } seed={ seed } />
        </Fragment>
    );
}
