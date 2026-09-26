import { useDeckState } from '../take-recorder';
import { HINT } from './deck-status.constants';

export function DeckStatus() {
    const { phase, song, message, saved } = useDeckState();

    return (
        <div className="flex flex-col gap-1 border border-line bg-void/70 p-3" data-phase={ phase }>
            <p className={ phase === 'recording' ? 'text-marigold' : 'text-hud' }>{ HINT[ phase ] }</p>
            { song && (
                <p className="text-dim">
                    { song.name } · { song.durationS.toFixed( 1 ) } s · { song.sha256.slice( 0, 12 ) }
                </p>
            ) }
            { saved && (
                <p className="text-fin" data-take-file={ saved.file }>
                    { saved.file } · { ( saved.bytes / 1024 ).toFixed( 0 ) } KB · { saved.keys } keys · { saved.ticks }{ ' ' }
                    ticks
                </p>
            ) }
            { message && <p className="text-threat">{ message }</p> }
        </div>
    );
}
