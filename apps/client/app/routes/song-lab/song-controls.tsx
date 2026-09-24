import { useSyncExternalStore } from 'react';
import { setSongVolume, songView, toggleSongMute } from './song-sync';

const BTN = 'border border-line-2 px-3 py-1';

export function SongControls() {
    const v = useSyncExternalStore( songView.subscribe, songView.get );
    return (
        <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className="w-16 text-dim">song</span>
                <button type="button" className={ BTN } onClick={ toggleSongMute }>
                    { v.muted ? 'Unmute' : 'Mute' }
                </button>
                <input
                    type="range"
                    min={ 0 }
                    max={ 1 }
                    step={ 0.05 }
                    value={ v.volume }
                    aria-label="song volume"
                    className="min-w-0 flex-1 accent-marigold"
                    onChange={ ( e ) => setSongVolume( Number( e.currentTarget.value ) ) }
                />
            </div>
            <p className="text-dim">
                { v.status === 'error' ? v.error : `${ v.file } · ${ v.status }` } · plays at 1× only · M mute
            </p>
        </section>
    );
}
