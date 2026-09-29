import { keyLabel } from '../../input/key-label';
import { DROP_KEY, FIRE_BACK_KEY, FIRE_KEY, NEXT_SLOT_KEY, PREVIOUS_SLOT_KEY } from '../../input/power-select';

export function powerHint(): string {
    return [
        `${ keyLabel( FIRE_KEY ) } Fire`,
        `${ keyLabel( FIRE_BACK_KEY ) } Back`,
        `${ keyLabel( PREVIOUS_SLOT_KEY ) }/${ keyLabel( NEXT_SLOT_KEY ) } Slot`,
        `${ keyLabel( DROP_KEY ) } Drop`,
    ].join( ' · ' );
}
