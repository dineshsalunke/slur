import { Stars } from '@react-three/drei';
import { Fragment } from 'react';
import type { EnvConfig } from './env-config';
import { GradientDome } from './gradient-dome';
import { SkyFollow } from './sky-follow';
import { TubeWalls } from './tube-walls';

// The parameterised atmosphere for the neon runner (ADD §11 art pass): background void + linear fog +
// optional gradient sky + drei star field + parallax neon canyon-walls, all driven by one EnvConfig.
// Post-FX is intentionally NOT here — the single global <Bloom> lives at the Canvas root (net-canvas /
// the env-lab route own it), driven by `config.bloom`. This composes the WORLD only, so it drops into the
// existing scene as one child without touching the track, ships, or the bloom pass.
export function Environment( { config, seed }: { config: EnvConfig; seed?: number } ) {
    return (
        <Fragment>
            <color attach="background" args={ [ config.background ] } />
            <fog attach="fog" args={ [ config.fog.color, config.fog.near, config.fog.far ] } />

            { /* Dome + stars ride the camera so the sky is effectively infinite as the ship travels. */ }
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
