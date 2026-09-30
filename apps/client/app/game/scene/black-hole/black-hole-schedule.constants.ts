import { scheduleSystems } from '../../frame/schedule';
import { type BlackHole, placeBlackHole, runBlackHole } from './black-hole.state';

export const BLACK_HOLE_SCHEDULE = scheduleSystems< BlackHole >( 'black-hole', [
    { id: 'black-hole.place', phase: 'view', run: placeBlackHole },
    { id: 'black-hole.pass', phase: 'prerender', run: runBlackHole },
] );

export const FACE_BACK = [ 0, Math.PI, 0 ] as const;
export const PLANE_ARGS = [ 2, 2 ] as const;
