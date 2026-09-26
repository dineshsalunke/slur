import { useFrame } from '@react-three/fiber';
import { useQueryFirst } from 'koota/react';
import { Suspense, useMemo } from 'react';
import { LocalPlayer, Render, Sim } from '../../../game/ecs/traits';
import { prefersReducedMotion } from '../../../game/scene/reduced-motion';
import { ShipModel } from '../../../game/scene/ship-model';
import { useShipChoice } from '../../../ship/ship-choice';
import {
    AHEAD,
    BOB_AMP,
    BOB_HZ,
    IDLE_BANK,
    LANE_X,
    PORTRAIT_AHEAD,
    REST_Y,
    TWO_PI,
    WIDE_ASPECT,
} from './landing-ship.constants';

export function LandingShip() {
    const entity = useQueryFirst( LocalPlayer, Render );
    const ship = useShipChoice();
    const still = useMemo( prefersReducedMotion, [] );

    useFrame( ( state ) => {
        const grp = entity?.get( Render );
        const sim = entity?.get( Sim );
        if ( ! grp || ! sim ) return;

        const phase = still ? 0 : state.clock.elapsedTime * BOB_HZ * TWO_PI;
        const aspect = state.size.width / state.size.height;
        grp.position.set(
            LANE_X * Math.min( 1, aspect / WIDE_ASPECT ),
            REST_Y + Math.sin( phase ) * BOB_AMP,
            sim.z + ( aspect < 1 ? PORTRAIT_AHEAD : AHEAD ),
        );
        grp.rotation.z = Math.cos( phase ) * IDLE_BANK;
    } );

    const group = entity?.get( Render );
    if ( ! entity || ! group ) return null;

    return (
        <primitive object={ group }>
            <Suspense fallback={ null }>
                <ShipModel key={ ship.id } entity={ entity } shipId={ ship.id } />
            </Suspense>
        </primitive>
    );
}
