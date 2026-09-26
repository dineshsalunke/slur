import { EditorActions } from './editor-actions';
import { EditorMap } from './editor-map';
import { EditorPalette } from './editor-palette';
import { EditorSaved } from './editor-saved';
import { EditorSnap } from './editor-snap';
import { EditorWarnings } from './editor-warnings';

export function TrackEditor() {
    return (
        <div className="fixed inset-0 z-40 flex bg-void font-display text-hud">
            <aside className="flex w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-line-2 bg-deep p-4">
                <h1 className="text-[13px] font-bold uppercase tracking-[0.3em] text-marigold">Track editor</h1>
                <EditorPalette />
                <EditorSnap />
                <EditorWarnings />
                <EditorActions />
                <EditorSaved />
                <p className="mt-auto text-[11px] leading-relaxed text-dim">
                    Click places one cell. Drag draws a rectangle. Wheel scrolls. Esc cancels a drag. Start at the
                    bottom; the grey band is locked.
                </p>
            </aside>
            <main className="min-w-0 flex-1">
                <EditorMap />
            </main>
        </div>
    );
}
