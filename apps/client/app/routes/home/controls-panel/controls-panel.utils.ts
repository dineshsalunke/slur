import { MUTE_KEY } from '../../../audio/game-audio/game-audio.constants';
import { keyLabel } from '../../../game/input/key-label';
import {
    BRAKE_ARROW_KEY,
    BRAKE_KEY,
    JUMP_KEY,
    STRAFE_LEFT_KEY,
    STRAFE_RIGHT_KEY,
    THROTTLE_KEY,
} from '../../../game/input/keyboard';
import { dropKeyFor, FIRE_BACK_KEY, fireKeyFor, NEXT_SLOT_KEY } from '../../../game/input/power-select';
import { REAR_VIEW_KEY } from '../../../game/input/rear-view-toggle';
import type { Hint } from '../../../ui/key-hint';

export function keyboardControls( mac: boolean ): Hint[] {
    const hint = ( codes: readonly string[], does: string ): Hint => ( { keys: codes.map( keyLabel ), does } );
    return [
        hint( [ THROTTLE_KEY ], 'Throttle' ),
        hint( [ BRAKE_KEY, BRAKE_ARROW_KEY ], 'Brake' ),
        hint( [ STRAFE_LEFT_KEY, STRAFE_RIGHT_KEY ], 'Strafe' ),
        hint( [ JUMP_KEY ], 'Jump' ),
        hint( [ fireKeyFor( mac ) ], 'Fire' ),
        hint( [ FIRE_BACK_KEY ], 'Fire back' ),
        hint( [ NEXT_SLOT_KEY ], 'Cycle' ),
        hint( [ dropKeyFor( mac ) ], 'Drop' ),
        hint( [ MUTE_KEY ], 'Mute' ),
        hint( [ REAR_VIEW_KEY ], 'Mirror' ),
    ];
}
