import type { TrackDescriptor } from '@slur/shared';
import { Fragment } from 'react';
import { NetCanvas } from './net-canvas';
import { Overlays } from './overlays/overlays';
import { QualityStepDown } from './quality-step-down/quality-step-down';

export function GameShell( { descriptor }: { descriptor: TrackDescriptor } ) {
    return (
        <Fragment>
            <NetCanvas descriptor={ descriptor }>
                <QualityStepDown />
            </NetCanvas>
            <Overlays />
        </Fragment>
    );
}
