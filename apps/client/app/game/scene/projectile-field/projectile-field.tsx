import { BOLT_SPAWN_AHEAD } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import { RENDER_DELAY_MS } from '../../ecs/net-systems';
import { NetProjectile, ProjInterp, type ProjSnapshot } from '../../ecs/traits';
import { type BoltSink, BoltStreaks } from '../bolt-streaks/bolt-streaks';
import { collectMineShots } from '../mine-shots';
import { sampleAt } from './projectile-field.utils';

export function ProjectileField() {
    const world = useWorld();

    const collect = useMemo( () => {
        let renderTime = 0;
        let out: BoltSink = () => {};
        const each = ( [ interp, net ]: [ { buffer: ProjSnapshot[] }, { dir: number } ] ) => {
            const pos = sampleAt( interp.buffer, renderTime );
            if ( ! pos ) return;
            out( pos.x, pos.y, pos.z, Math.abs( pos.z - interp.buffer[ 0 ].z ) + BOLT_SPAWN_AHEAD, net.dir );
        };
        return ( sink: BoltSink ) => {
            renderTime = performance.now() - RENDER_DELAY_MS;
            out = sink;
            world.query( ProjInterp, NetProjectile ).readEach( each );
            collectMineShots( world, sink );
        };
    }, [ world ] );

    return <BoltStreaks collect={ collect } />;
}
