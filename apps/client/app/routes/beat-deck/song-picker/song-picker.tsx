import { pickSong, useDeckState } from '../take-recorder';
import { BUSY } from './song-picker.constants';

export function SongPicker() {
    const { phase } = useDeckState();

    return (
        <label className="flex items-center gap-2">
            <span className="w-10 text-dim">Song</span>
            <input
                type="file"
                accept="audio/*"
                disabled={ BUSY.has( phase ) }
                className="text-hud file:mr-2 file:border file:border-line-2 file:bg-deep file:px-2 file:py-1 file:text-hud"
                onChange={ ( e ) => {
                    const file = e.currentTarget.files?.[ 0 ];
                    e.currentTarget.blur();
                    if ( file ) void pickSong( file );
                } }
            />
        </label>
    );
}
