import { useWorld } from 'koota/react';
import { useCallback } from 'react';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetSeeker, ProjInterp, SeekerTrail } from '../ecs/traits';
import { sampleAt } from './projectile-field';
import { SeekerBodies, type SeekerSink } from './seeker-bodies';

export function SeekerField() {
    const world = useWorld();

    const collect = useCallback(
        ( sink: SeekerSink ) => {
            const renderTime = performance.now() - RENDER_DELAY_MS;
            world.query( ProjInterp, SeekerTrail, NetSeeker ).readEach( ( [ interp, trail ] ) => {
                const pos = sampleAt( interp.buffer, renderTime );
                if ( pos ) sink( pos.x, pos.y, pos.z, trail );
            } );
        },
        [ world ],
    );

    return <SeekerBodies collect={ collect } />;
}
