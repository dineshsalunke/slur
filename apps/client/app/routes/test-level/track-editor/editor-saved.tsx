import { Link, useLoaderData } from 'react-router';
import type { SavedTrack } from './track-editor.state';

export function EditorSaved() {
    const { saved } = useLoaderData< { saved: SavedTrack[] } >();
    return (
        <section className="flex min-h-0 flex-col gap-1">
            <h2 className="mb-1 text-[11px] uppercase tracking-[0.2em] text-dim">Saved tracks</h2>
            { saved.length === 0 ? <p className="text-[12px] text-dim">None yet.</p> : null }
            <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
                { saved.map( ( t ) => (
                    <li key={ t.id } className="flex items-center gap-2 text-[13px] text-hud">
                        <span className="min-w-0 flex-1 truncate font-mono">{ t.name }</span>
                        <Link to={ `/test-level/edit?level=${ t.id }` } className="text-cyan hover:underline">
                            edit
                        </Link>
                        <Link to={ `/test-level?level=${ t.id }` } className="text-marigold hover:underline">
                            play
                        </Link>
                    </li>
                ) ) }
            </ul>
        </section>
    );
}
