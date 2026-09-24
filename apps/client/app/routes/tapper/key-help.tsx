import { NOTE_TOKENS } from '@slur/shared';

const KEYS: [ string, string ][] = [
    [ 'A / D', 'l / r' ],
    [ 'Shift+A / Shift+D', 'L / R' ],
    [ 'hold A / D (≥ 1 beat)', '< / >' ],
    [ 'Space', 'J' ],
    [ 'Space Space (≤ 250 ms)', 'JJ' ],
    [ 'S', 'S (smash)' ],
    [ 'Enter', 'play / stop' ],
    [ 'R', 'record the next loop pass (from stop: one-bar count-in)' ],
    [ '← / →', 'seek one bar' ],
    [ 'M', 'metronome on / off' ],
    [ 'Esc', 'cancel recording' ],
    [ '⌘Z / Ctrl+Z', 'undo last take change' ],
];

export function KeyHelp() {
    return (
        <section className="text-dim text-xs">
            <p className="mb-1">Score tokens: { NOTE_TOKENS.join( ' ' ) }</p>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4">
                { KEYS.map( ( [ k, v ] ) => (
                    <div key={ k } className="contents">
                        <dt className="text-hud">{ k }</dt>
                        <dd>{ v }</dd>
                    </div>
                ) ) }
            </dl>
        </section>
    );
}
