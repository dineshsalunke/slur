import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetSeeker, ProjInterp, type ProjSnapshot, SeekerTrail } from '../ecs/traits';
import { sampleAt } from './projectile-field/projectile-field.utils';
import { SeekerBodies, type SeekerSink } from './seeker-bodies/seeker-bodies';
import type { SeekerTrailRing } from './seeker-trail';

export function SeekerField() {
    const world = useWorld();

    const collect = useMemo( () => {
        let renderTime = 0;
        let out: SeekerSink = () => {};
        const each = ( [ interp, trail ]: [ { buffer: ProjSnapshot[] }, SeekerTrailRing, ...unknown[] ] ) => {
            const pos = sampleAt( interp.buffer, renderTime );
            if ( pos ) out( pos.x, pos.y, pos.z, trail );
        };
        return ( sink: SeekerSink ) => {
            renderTime = performance.now() - RENDER_DELAY_MS;
            out = sink;
            world.query( ProjInterp, SeekerTrail, NetSeeker ).readEach( each );
        };
    }, [ world ] );

    return <SeekerBodies collect={ collect } />;
}
