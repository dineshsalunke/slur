import { Pin } from './pin';
import type { TapNote } from './take-model';

export interface LaneSpan {
    fromBar: number;
    toBar: number;
    beatsPerBar: number;
}

export function NoteLane( { notes, span, tone }: { notes: TapNote[]; span: LaneSpan; tone: string } ) {
    const beats = ( span.toBar - span.fromBar ) * span.beatsPerBar;
    const bars = Array.from( { length: span.toBar - span.fromBar }, ( _, i ) => span.fromBar + i );
    return (
        <div className="relative h-12 border border-line bg-deep">
            { bars.map( ( b ) => (
                <Pin
                    key={ b }
                    x={ ( ( b - span.fromBar ) * span.beatsPerBar ) / beats }
                    className="top-0 h-full border-line-2 border-l pl-0.5 text-[10px] text-dim"
                >
                    { b }
                </Pin>
            ) ) }
            { notes.map( ( n ) => (
                <Pin
                    key={ `${ n.t }-${ n.token }` }
                    x={ ( ( n.bar - span.fromBar ) * span.beatsPerBar + n.beatInBar ) / beats }
                    className={ `bottom-1 -translate-x-1/2 px-0.5 font-bold ${ tone }` }
                >
                    { n.token }
                </Pin>
            ) ) }
        </div>
    );
}
