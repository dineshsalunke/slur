import { useDeckState } from './take-recorder';

const HINT = {
    empty: 'Pick an mp3 to begin.',
    loading: 'Decoding the song…',
    ready: 'Enter: start the song and the take.',
    starting: 'Starting…',
    recording: 'Recording. A/D strafe · Space jump · Esc stop.',
    saving: 'Saving the take…',
    saved: 'Saved. Enter: record another take.',
    error: 'Something failed. Pick a song or press Enter to retry.',
} as const;

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
