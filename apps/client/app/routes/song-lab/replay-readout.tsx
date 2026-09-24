import { addEffect } from '@react-three/fiber';
import { FIXED_DT } from '@slur/shared';
import { replay } from './replay-state';
import { songLine } from './song-sync';

function attachReadout( el: HTMLParagraphElement | null ): ( () => void ) | undefined {
    if ( ! el ) return undefined;
    return addEffect( () => {
        const { ticks, deaths } = replay.tally;
        const t = ( ticks * FIXED_DT ).toFixed( 2 );
        const song = songLine();
        el.textContent = `tick ${ ticks } / ${ replay.inputs.length } · ${ t } s · deaths ${ deaths }${ song ? `\n${ song }` : '' }`;
    } );
}

export function ReplayReadout() {
    return (
        <p
            ref={ attachReadout }
            className="pointer-events-none absolute top-2 left-2 whitespace-pre bg-void/70 px-2 py-1 font-mono text-fg text-xs"
        />
    );
}
