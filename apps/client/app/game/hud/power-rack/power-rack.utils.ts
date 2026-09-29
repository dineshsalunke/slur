import { keyLabel, macKeyboard } from '../../input/key-label';
import { dropKeyFor, FIRE_BACK_KEY, fireKeyFor, NEXT_SLOT_KEY } from '../../input/power-select';

export function powerHint(): string {
    const mac = macKeyboard();
    return [
        `${ keyLabel( fireKeyFor( mac ) ) } Fire`,
        `${ keyLabel( FIRE_BACK_KEY ) } Back`,
        `${ keyLabel( NEXT_SLOT_KEY ) } Cycle`,
        `${ keyLabel( dropKeyFor( mac ) ) } Drop`,
    ].join( ' · ' );
}
