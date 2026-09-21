import type { TrackDescriptor } from '@slur/shared';
import { Fragment } from 'react';
import { NetCanvas } from './net-canvas';
import { Overlays } from './overlays/overlays';

export function GameShell( { descriptor }: { descriptor: TrackDescriptor } ) {
    return (
        <Fragment>
            <NetCanvas descriptor={ descriptor } />
            <Overlays />
        </Fragment>
    );
}
