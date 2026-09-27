import { EditorActions } from './editor-actions';
import { EditorMap } from './editor-map';
import { EditorPalette } from './editor-palette';
import { EditorSaved } from './editor-saved';
import { EditorSnap } from './editor-snap';
import { EditorStartMenu } from './editor-start-menu';
import { EditorStartNote } from './editor-start-note';
import { EditorWarnings } from './editor-warnings';
import { EditorZoom } from './editor-zoom';

export function TrackEditor() {
    return (
        <div className="fixed inset-0 z-40 flex bg-void font-display text-hud">
            <aside className="flex w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-line-2 bg-deep p-4">
                <h1 className="text-[13px] font-bold uppercase tracking-[0.3em] text-marigold">Track editor</h1>
                <EditorPalette />
                <EditorSnap />
                <EditorZoom />
                <EditorWarnings />
                <EditorStartNote />
                <EditorActions />
                <EditorSaved />
                <p className="mt-auto text-[11px] leading-relaxed text-dim">
                    Click places one cell. Drag draws a rectangle. Wheel scrolls. Ctrl or ⌘ + wheel, or a pinch, zooms
                    at the pointer. Esc cancels a drag. Start at the bottom; the grey band is locked. Right-click sets
                    where Play starts. In the game, Backspace resets the run; Shift + Backspace also clears the start.
                </p>
            </aside>
            <main className="relative min-w-0 flex-1">
                <EditorMap />
                <EditorStartMenu />
            </main>
        </div>
    );
}
