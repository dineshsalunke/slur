import { noteVoice, PACING_DZ, type PacingScore, type ScoreNote } from '@slur/shared';

const MIN_NOTE_S = 0.06;
const REGISTER_BAR = 0.12;

const VOICE_CLASS = { lateral: 'fill-cyan', air: 'fill-marigold', smash: 'fill-fg' } as const;

interface NoteRowProps {
    score: PacingScore;
    cruise: number;
    top: number;
    height: number;
}

function noteClass( n: ScoreNote ): string {
    return VOICE_CLASS[ noteVoice( n ) ];
}

export function NoteRow( { score, cruise, top, height }: NoteRowProps ) {
    const t = ( k: number ): number => ( k * PACING_DZ ) / cruise;
    return (
        <g>
            { score.notes.map( ( n, i ) => (
                <g key={ `${ n.k0 }-${ i }` }>
                    <rect
                        x={ t( n.k0 ) }
                        y={ top + height - REGISTER_BAR }
                        width={ n.spacing / cruise }
                        height={ REGISTER_BAR }
                        className="fill-fg/15"
                    />
                    { n.early > 0 && (
                        <rect
                            x={ t( n.k0 ) - n.early / cruise }
                            y={ top }
                            width={ n.early / cruise }
                            height={ height }
                            className="fill-threat/40"
                        />
                    ) }
                    <rect
                        x={ t( n.k0 ) }
                        y={ top }
                        width={ Math.max( MIN_NOTE_S, t( n.k1 + 1 ) - t( n.k0 ) ) }
                        height={ height - REGISTER_BAR }
                        className={ noteClass( n ) }
                    />
                </g>
            ) ) }
        </g>
    );
}
