import { EDITOR_TOOLS } from './track-editor.constants';
import { setTool } from './track-editor.state';
import { useEditorStore } from './use-editor-store';

export function EditorPalette() {
    const tool = useEditorStore( ( s ) => s.tool );
    return (
        <fieldset className="flex flex-col gap-1">
            <legend className="mb-2 text-[11px] uppercase tracking-[0.2em] text-dim">Tool</legend>
            { EDITOR_TOOLS.map( ( t ) => (
                <button
                    key={ t.id }
                    type="button"
                    aria-pressed={ t.id === tool }
                    onClick={ () => setTool( t.id ) }
                    className="flex cursor-pointer items-center justify-between border border-line-2 px-3 py-2 text-left text-[13px] text-hud hover:border-marigold aria-pressed:border-marigold aria-pressed:bg-marigold aria-pressed:text-deep"
                >
                    <span>{ t.label }</span>
                    <kbd className="font-mono text-[11px] opacity-70">{ t.key }</kbd>
                </button>
            ) ) }
        </fieldset>
    );
}
