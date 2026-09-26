import { attachMap, cancelMap, leaveMap, moveMap, pressMap, releaseMap, wheelMap } from './track-editor.state';

export function EditorMap() {
    return (
        <canvas
            ref={ attachMap }
            onPointerDown={ pressMap }
            onPointerMove={ moveMap }
            onPointerUp={ releaseMap }
            onPointerCancel={ cancelMap }
            onPointerLeave={ leaveMap }
            onWheel={ wheelMap }
            className="block h-full w-full cursor-crosshair touch-none"
        />
    );
}
