import { travel } from './track-editor.state';
import { useEditorStore } from './use-editor-store';

export function EditorUndo() {
    const canUndo = useEditorStore( ( s ) => s.history.past.length > 0 );
    const canRedo = useEditorStore( ( s ) => s.history.future.length > 0 );
    return (
        <div className="grid grid-cols-2 gap-1">
            <button
                type="button"
                disabled={ ! canUndo }
                onClick={ () => travel( 'undo' ) }
                className="cursor-pointer border border-line-2 py-2 text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold disabled:cursor-default disabled:opacity-40"
            >
                Undo
            </button>
            <button
                type="button"
                disabled={ ! canRedo }
                onClick={ () => travel( 'redo' ) }
                className="cursor-pointer border border-line-2 py-2 text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold disabled:cursor-default disabled:opacity-40"
            >
                Redo
            </button>
        </div>
    );
}
