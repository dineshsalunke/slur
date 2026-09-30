import type { TugEvent } from '@slur/shared';
import { playSfx } from '../../audio/sfx-map';

const TUG_RATE = 0.7;
const TUG_FAR_GAIN = 0.4;

export function playTugEvent( e: TugEvent, me: string ): void {
    if ( e.outcome === 'latch' && e.targetId === me ) playSfx( 'stun' );
    if ( e.outcome !== 'throw' ) return;
    playSfx( 'seekerFire', e.ownerId === me ? { rate: TUG_RATE } : { rate: TUG_RATE, gain: TUG_FAR_GAIN } );
}
