import type { ProjSnapshot } from '../../ecs/traits';
import { _pos } from './projectile-field.constants';

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
