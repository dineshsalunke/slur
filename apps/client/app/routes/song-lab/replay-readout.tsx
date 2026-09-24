import { addEffect } from '@react-three/fiber';
import { FIXED_DT } from '@slur/shared';
import { replay } from './replay-state';

function attachReadout( el: HTMLParagraphElement | null ): ( () => void ) | undefined {
    if ( ! el ) return undefined;
    return addEffect( () => {
        const { ticks, deaths } = replay.tally;
        const t = ( ticks * FIXED_DT ).toFixed( 2 );
        el.textContent = `tick ${ ticks } / ${ replay.inputs.length } · ${ t } s · deaths ${ deaths }`;
    } );
}

export function ReplayReadout() {
    return (
        <p
            ref={ attachReadout }
            className="pointer-events-none absolute top-2 left-2 bg-void/70 px-2 py-1 font-mono text-fg text-xs"
        />
    );
}
