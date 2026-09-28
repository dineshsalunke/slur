import { Fragment, useMemo } from 'react';
import { useTrack } from '../../track-context/use-track';
import { accent } from '../accent';
import { FinishOutline } from '../finish-outline/finish-outline';
import { GATE_FRAME, outlineStrips } from '../monolith-frame';
import { MonolithFrames } from '../monolith-frames/monolith-frames';
import { BAND_PROUD, BAND_WIDTH, CORE_EMISSIVE, CORE_PROUD, CORE_WIDTH, GLOW_INTENSITY } from './finish-gate.constants';
import { finishTiles } from './finish-gate.utils';

export function FinishGate() {
    const track = useTrack();
    const gate = useMemo( () => [ { z: track.finishZ, height: GATE_FRAME.height } ], [ track.finishZ ] );
    const band = useMemo( () => outlineStrips( GATE_FRAME, gate[ 0 ], BAND_WIDTH, BAND_PROUD ), [ gate ] );
    const core = useMemo( () => outlineStrips( GATE_FRAME, gate[ 0 ], CORE_WIDTH, CORE_PROUD ), [ gate ] );
    const tiles = useMemo( () => finishTiles( track.finishZ ), [ track.finishZ ] );
    return (
        <Fragment>
            <MonolithFrames frame={ GATE_FRAME } placements={ gate } />
            <FinishOutline strips={ band } emissive={ accent() } intensity={ GLOW_INTENSITY } />
            <FinishOutline strips={ core } emissive={ CORE_EMISSIVE } intensity={ GLOW_INTENSITY } />
            <FinishOutline strips={ tiles } emissive={ accent() } intensity={ GLOW_INTENSITY } />
        </Fragment>
    );
}
