import { BOLT_SPAWN_AHEAD } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useCallback } from 'react';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetProjectile, ProjInterp, type ProjSnapshot } from '../ecs/traits';
import { type BoltSink, BoltStreaks } from './bolt-streaks';

const _pos: ProjSnapshot = { t: 0, x: 0, y: 0, z: 0 };

export function sampleAt( buffer: ProjSnapshot[], renderTime: number ): ProjSnapshot | null {
    if ( buffer.length === 0 ) return null;
    if ( renderTime <= buffer[ 0 ].t ) return buffer[ 0 ];
    for ( let i = 0; i < buffer.length - 1; i++ ) {
        const a = buffer[ i ];
        const b = buffer[ i + 1 ];
        if ( a.t <= renderTime && b.t >= renderTime ) {
            const t = ( renderTime - a.t ) / ( b.t - a.t || 1 );
            _pos.t = renderTime;
            _pos.x = a.x + ( b.x - a.x ) * t;
            _pos.y = a.y + ( b.y - a.y ) * t;
            _pos.z = a.z + ( b.z - a.z ) * t;
            return _pos;
        }
    }
    return buffer[ buffer.length - 1 ];
}

export function ProjectileField() {
    const world = useWorld();

    const collect = useCallback(
        ( sink: BoltSink ) => {
            const renderTime = performance.now() - RENDER_DELAY_MS;
            world.query( ProjInterp, NetProjectile ).readEach( ( [ interp, net ] ) => {
                const pos = sampleAt( interp.buffer, renderTime );
                if ( ! pos ) return;
                sink( pos.x, pos.y, pos.z, Math.abs( pos.z - interp.buffer[ 0 ].z ) + BOLT_SPAWN_AHEAD, net.dir );
            } );
        },
        [ world ],
    );

    return <BoltStreaks collect={ collect } />;
}
