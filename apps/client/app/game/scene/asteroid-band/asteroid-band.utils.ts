import type { AsteroidPlacement } from '../asteroid-field';
import { SPIN_FLOOR, SPIN_RANGE, SPIN_REFERENCE_SIZE } from './asteroid-band.constants';

export function writeSpin( spin: Float32Array, i: number, p: AsteroidPlacement ): void {
    const [ a, b, c ] = p.rotation;
    const x = Math.sin( a );
    const y = Math.cos( b );
    const z = Math.sin( c + a );
    const len = Math.hypot( x, y, z ) || 1;
    const direction = Math.cos( a * 3 + c ) >= 0 ? 1 : -1;
    const rate = ( SPIN_FLOOR + SPIN_RANGE * ( ( ( b + c ) / ( Math.PI * 4 ) ) % 1 ) ) * direction;
    spin[ i * 4 ] = x / len;
    spin[ i * 4 + 1 ] = y / len;
    spin[ i * 4 + 2 ] = z / len;
    spin[ i * 4 + 3 ] = rate * Math.min( 1, SPIN_REFERENCE_SIZE / p.size );
}
