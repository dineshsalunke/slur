import { keyOf } from '../../input/bindings';
import { keyLabel } from '../../input/key-label';

export function powerHint(): string {
    return [
        `${ keyLabel( keyOf( 'fireForward' ) ) } Fire`,
        `${ keyLabel( keyOf( 'fireBack' ) ) } Back`,
        `${ keyLabel( keyOf( 'previous' ) ) }/${ keyLabel( keyOf( 'next' ) ) } Slot`,
        `${ keyLabel( keyOf( 'drop' ) ) } Drop`,
    ].join( ' · ' );
}
