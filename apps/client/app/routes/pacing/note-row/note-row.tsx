import { PACING_DZ, type PacingScore } from '@slur/shared';
import { MIN_NOTE_S, REGISTER_BAR } from './note-row.constants';
import { noteClass } from './note-row.utils';

interface NoteRowProps {
    score: PacingScore;
    cruise: number;
    top: number;
    height: number;
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
