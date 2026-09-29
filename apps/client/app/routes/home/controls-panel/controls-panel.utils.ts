import { MUTE_KEY } from '../../../audio/game-audio/game-audio.constants';
import { keyLabel } from '../../../game/input/key-label';
import { BRAKE_KEY, JUMP_KEY, STRAFE_LEFT_KEY, STRAFE_RIGHT_KEY, THROTTLE_KEY } from '../../../game/input/keyboard';
import { DROP_KEY, FIRE_BACK_KEY, FIRE_KEY, NEXT_SLOT_KEY, PREVIOUS_SLOT_KEY } from '../../../game/input/power-select';
import type { Hint } from '../../../ui/key-hint';

export function keyboardControls(): Hint[] {
    const hint = ( codes: readonly string[], does: string ): Hint => ( { keys: codes.map( keyLabel ), does } );
    return [
        hint( [ THROTTLE_KEY ], 'Throttle' ),
        hint( [ BRAKE_KEY ], 'Brake' ),
        hint( [ STRAFE_LEFT_KEY, STRAFE_RIGHT_KEY ], 'Strafe' ),
        hint( [ JUMP_KEY ], 'Jump' ),
        hint( [ FIRE_KEY ], 'Fire' ),
        hint( [ FIRE_BACK_KEY ], 'Fire back' ),
        hint( [ PREVIOUS_SLOT_KEY, NEXT_SLOT_KEY ], 'Slot' ),
        hint( [ DROP_KEY ], 'Drop' ),
        hint( [ MUTE_KEY ], 'Mute' ),
    ];
}
