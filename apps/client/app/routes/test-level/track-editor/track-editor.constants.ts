import type { EditorSnap, EditorTool } from './track-editor.state';

export const EDITOR_SNAPS: readonly EditorSnap[] = [ 1, 2, 4, 8 ];

export const EDITOR_TOOLS: readonly { id: EditorTool; label: string; key: string }[] = [
    { id: 'destructible', label: 'Destructible block', key: '1' },
    { id: 'solid', label: 'Solid block', key: '2' },
    { id: 'gap', label: 'Gap', key: '3' },
    { id: 'eraser', label: 'Eraser', key: '4' },
];

export const MAP_MARGIN_LEFT = 56;
export const MAP_MARGIN_RIGHT = 24;
export const MAP_MAX_SCALE = 12;
export const MIN_GRID_PX = 4;
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 8;
export const ZOOM_STEP = Math.SQRT2;
export const WHEEL_ZOOM_RATE = 0.002;
export const LABEL_EVERY_SEGMENTS = 5;

export const MAP_COLORS = {
    void: '#05060a',
    deck: '#162028',
    grid: 'rgba(120, 160, 200, 0.14)',
    segment: 'rgba(120, 160, 200, 0.34)',
    label: '#6b7787',
    locked: 'rgba(107, 119, 135, 0.28)',
    crowded: 'rgba(255, 92, 110, 0.22)',
    destructible: '#f5b024',
    destructibleEdge: '#ffe0a0',
    solid: '#4a5868',
    solidEdge: '#9fb0c2',
    gapEdge: '#ff5c6e',
    eraser: '#ff2bd6',
    finish: '#00ff85',
    start: '#35e0ff',
} as const;

export const START_SNAP_EPS = 0.01;

export const HISTORY_CAP = 200;

export const START_MARKER_MIN_PX = 6;

export const TOOL_PREVIEW: Readonly< Record< EditorTool, string > > = {
    destructible: 'rgba(245, 176, 36, 0.55)',
    solid: 'rgba(159, 176, 194, 0.5)',
    gap: 'rgba(5, 6, 10, 0.85)',
    eraser: 'rgba(255, 43, 214, 0.35)',
};
