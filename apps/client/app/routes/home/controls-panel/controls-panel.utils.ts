import { keyOf } from '../../../game/input/bindings';
import { keyLabel } from '../../../game/input/key-label';
import { BRAKE_KEY, JUMP_KEY, STRAFE_LEFT_KEY, STRAFE_RIGHT_KEY, THROTTLE_KEY } from '../../../game/input/keyboard';
import type { Hint } from '../../../ui/key-hint';

export function keyboardControls(): Hint[] {
    const hint = ( codes: readonly string[], does: string ): Hint => ( { keys: codes.map( keyLabel ), does } );
    return [
        hint( [ THROTTLE_KEY ], 'Throttle' ),
        hint( [ BRAKE_KEY ], 'Brake' ),
        hint( [ STRAFE_LEFT_KEY, STRAFE_RIGHT_KEY ], 'Strafe' ),
        hint( [ JUMP_KEY ], 'Jump' ),
        hint( [ keyOf( 'fireForward' ) ], 'Fire' ),
        hint( [ keyOf( 'fireBack' ) ], 'Fire back' ),
        hint( [ keyOf( 'previous' ), keyOf( 'next' ) ], 'Slot' ),
        hint( [ keyOf( 'drop' ) ], 'Drop' ),
        hint( [ keyOf( 'mute' ) ], 'Mute' ),
    ];
}
