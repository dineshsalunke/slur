import { EditorSavedRow } from './editor-saved-row';
import { useEditorStore } from './use-editor-store';

export function EditorSaved() {
    const saved = useEditorStore( ( s ) => s.saved );
    return (
        <section className="flex min-h-0 flex-col gap-1">
            <h2 className="mb-1 text-[11px] uppercase tracking-[0.2em] text-dim">Saved tracks</h2>
            { saved.length === 0 ? <p className="text-[12px] text-dim">None yet.</p> : null }
            <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
                { saved.map( ( t ) => (
                    <EditorSavedRow key={ t.id } track={ t } />
                ) ) }
            </ul>
        </section>
    );
}
