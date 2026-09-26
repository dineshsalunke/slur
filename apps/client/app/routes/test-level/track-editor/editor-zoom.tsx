import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './track-editor.constants';
import { fitWidth, zoomBy } from './track-editor.state';
import { useEditorStore } from './use-editor-store';

export function EditorZoom() {
    const zoom = useEditorStore( ( s ) => s.camera.zoom );
    return (
        <fieldset className="flex flex-col gap-1">
            <legend className="mb-2 text-[11px] uppercase tracking-[0.2em] text-dim">Zoom</legend>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <button
                    type="button"
                    aria-label="Zoom out"
                    disabled={ zoom <= ZOOM_MIN }
                    onClick={ () => zoomBy( 1 / ZOOM_STEP ) }
                    className="cursor-pointer border border-line-2 py-2 font-mono text-[13px] text-hud hover:border-marigold disabled:cursor-default disabled:opacity-40"
                >
                    −
                </button>
                <output className="min-w-14 text-center font-mono text-[13px] text-hud">
                    { Math.round( zoom * 100 ) }%
                </output>
                <button
                    type="button"
                    aria-label="Zoom in"
                    disabled={ zoom >= ZOOM_MAX }
                    onClick={ () => zoomBy( ZOOM_STEP ) }
                    className="cursor-pointer border border-line-2 py-2 font-mono text-[13px] text-hud hover:border-marigold disabled:cursor-default disabled:opacity-40"
                >
                    +
                </button>
            </div>
            <button
                type="button"
                onClick={ fitWidth }
                className="cursor-pointer border border-line-2 py-2 text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold"
            >
                Fit width
            </button>
        </fieldset>
    );
}
