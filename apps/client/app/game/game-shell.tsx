import type { TrackDescriptor } from '@slur/shared';
import { Fragment } from 'react';
import { NetCanvas } from './net-canvas';
import { Overlays } from './overlays/overlays';

// The Canvas PARENT holds ZERO reactive state → <NetCanvas> (the WebGL scene) mounts once and NEVER
// re-renders (acceptance gate #1). ALL live run-state subscriptions live in the <Overlays> LEAF sibling, so
// an overlay re-render (up to 20Hz) stays in the DOM layer and never churns the scene graph (r3f.md #1).
export function GameShell( { descriptor }: { descriptor: TrackDescriptor } ) {
    return (
        <Fragment>
            <NetCanvas descriptor={ descriptor } />
            <Overlays />
        </Fragment>
    );
}
