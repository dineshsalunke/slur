import { Link, useFetcher } from 'react-router';
import type { SavedTrack } from './editor-tracks';
import { askDelete } from './track-editor.state';
import { useEditorStore } from './use-editor-store';

export function EditorSavedRow( { track }: { track: SavedTrack } ) {
    const confirming = useEditorStore( ( s ) => s.confirmDelete === track.id );
    const fetcher = useFetcher< { error?: string } >();
    const deleting = fetcher.state !== 'idle';
    return (
        <li className="flex flex-col gap-1 text-[13px] text-hud">
            <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono">{ track.name }</span>
                { confirming ? (
                    <fetcher.Form method="post" className="flex items-center gap-2">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={ track.id } />
                        <span className="text-threat">delete?</span>
                        <button
                            type="submit"
                            disabled={ deleting }
                            className="cursor-pointer text-threat hover:underline disabled:cursor-wait disabled:opacity-70"
                        >
                            { deleting ? 'deleting…' : 'yes' }
                        </button>
                        <button
                            type="button"
                            disabled={ deleting }
                            onClick={ () => askDelete( null ) }
                            className="cursor-pointer text-dim hover:underline"
                        >
                            no
                        </button>
                    </fetcher.Form>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link to={ `/test-level/edit?level=${ track.id }` } className="text-cyan hover:underline">
                            edit
                        </Link>
                        <Link to={ `/test-level?level=${ track.id }` } className="text-marigold hover:underline">
                            play
                        </Link>
                        <button
                            type="button"
                            onClick={ () => askDelete( track.id ) }
                            className="cursor-pointer text-dim hover:text-threat hover:underline"
                        >
                            delete
                        </button>
                    </div>
                ) }
            </div>
            { fetcher.data?.error ? <p className="text-[12px] text-threat">{ fetcher.data.error }</p> : null }
        </li>
    );
}
