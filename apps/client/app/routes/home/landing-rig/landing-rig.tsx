import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { LocalPlayer, Net, Render, Sim } from '../../../game/ecs/traits';
import { FrameSchedule } from '../../../game/frame/frame-schedule/frame-schedule';
import { prefersReducedMotion } from '../../../game/scene/reduced-motion';
import { currentShip } from '../../../ship/ship-choice';
import type { LandingFrame } from './landing-rig.utils';
import { LANDING_SCHEDULE } from './landing-schedule.constants';

export function LandingRig( { loopZ }: { loopZ: number } ) {
    const world = useWorld();
    const still = useMemo( prefersReducedMotion, [] );
    const frame = useMemo< LandingFrame >(
        () => ( { world, loopZ, still, ready: false, z: 0 } ),
        [ world, loopZ, still ],
    );

    // Syncs with the koota ECS world (a module singleton): the backdrop needs one local ship entity to drive.
    useEffect( () => {
        const e = world.spawn( Sim, LocalPlayer, Render, Net( { shipId: currentShip().id } ) );
        return () => e.destroy();
    }, [ world ] );

    return <FrameSchedule schedule={ LANDING_SCHEDULE } context={ frame } />;
}
