import { onFrame } from './tapper-clock';

function attach( el: HTMLSpanElement | null ) {
    if ( ! el ) return;
    return onFrame( ( p ) => {
        el.textContent = `bar ${ p.bar } · beat ${ ( p.beatInBar + 1 ).toFixed( 1 ) } · ${ p.songT.toFixed( 2 ) } s`;
    } );
}

export function PlayheadReadout() {
    return (
        <span ref={ attach } className="text-hud tabular-nums">
            —
        </span>
    );
}
