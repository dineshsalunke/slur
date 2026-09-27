import { attachMap, cancelMap, leaveMap, moveMap, openStartMenu, pressMap, releaseMap } from './track-editor.state';

export function EditorMap() {
    return (
        <canvas
            ref={ attachMap }
            onPointerDown={ pressMap }
            onPointerMove={ moveMap }
            onPointerUp={ releaseMap }
            onPointerCancel={ cancelMap }
            onPointerLeave={ leaveMap }
            onContextMenu={ openStartMenu }
            className="block h-full w-full cursor-crosshair touch-none"
        />
    );
}
