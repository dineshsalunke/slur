import { useFrame } from '@react-three/fiber';
import { useQueryFirst } from 'koota/react';
import { Suspense, useMemo, useRef } from 'react';
import { LocalPlayer, Net, Render, Sim } from '../../game/ecs/traits';
import { ShipModel } from '../../game/scene/ship-model';
import { prefersReducedMotion } from './reduced-motion';
import { currentShip, useShipChoice } from './ship-choice';

const AHEAD = 2;
const LANE_X = -2.6;
const WIDE_ASPECT = 1.6;
const REST_Y = 1.1;
const BOB_AMP = 0.14;
const BOB_HZ = 0.45;
const IDLE_BANK = 0.05;
const BANK_KICK = 4;
const BANK_STIFFNESS = 60;
const BANK_DAMPING = 9;
const MAX_STEP = 1 / 30;
const TWO_PI = Math.PI * 2;

export function LandingShip() {
    const entity = useQueryFirst( LocalPlayer, Render );
    const ship = useShipChoice();
    const roll = useRef( { angle: 0, rate: 0, turn: currentShip().turn } );
    const still = useMemo( prefersReducedMotion, [] );

    useFrame( ( state, delta ) => {
        const grp = entity?.get( Render );
        const sim = entity?.get( Sim );
        if ( ! entity || ! grp || ! sim ) return;

        const r = roll.current;
        const choice = currentShip();
        if ( choice.turn !== r.turn ) {
            r.turn = choice.turn;
            entity.set( Net, { shipId: choice.id } );
            if ( ! still ) r.rate += choice.dir * BANK_KICK;
        }
        const dt = Math.min( delta, MAX_STEP );
        r.rate += ( -BANK_STIFFNESS * r.angle - BANK_DAMPING * r.rate ) * dt;
        r.angle += r.rate * dt;

        const phase = still ? 0 : state.clock.elapsedTime * BOB_HZ * TWO_PI;
        grp.position.set(
            LANE_X * Math.min( 1, state.size.width / state.size.height / WIDE_ASPECT ),
            REST_Y + Math.sin( phase ) * BOB_AMP,
            sim.z + AHEAD,
        );
        grp.rotation.z = r.angle + Math.cos( phase ) * IDLE_BANK;
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
