import { EDITOR_SNAPS } from './track-editor.constants';
import { setSnap } from './track-editor.state';
import { useEditorStore } from './use-editor-store';

export function EditorSnap() {
    const snap = useEditorStore( ( s ) => s.snap );
    return (
        <fieldset className="flex flex-col gap-1">
            <legend className="mb-2 text-[11px] uppercase tracking-[0.2em] text-dim">Snap</legend>
            <div className="grid grid-cols-4 gap-1">
                { EDITOR_SNAPS.map( ( s ) => (
                    <button
                        key={ s }
                        type="button"
                        aria-pressed={ s === snap }
                        onClick={ () => setSnap( s ) }
                        className="cursor-pointer border border-line-2 py-2 font-mono text-[13px] text-hud hover:border-marigold aria-pressed:border-marigold aria-pressed:bg-marigold aria-pressed:text-deep"
                    >
                        { s }u
                    </button>
                ) ) }
            </div>
        </fieldset>
    );
}
