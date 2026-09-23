import { HALF_WIDTH, type Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { ACCENT_ANCHOR } from './accent';
import { GATE_FRAME } from './monolith-frame';
import { MonolithFrames } from './monolith-frames';

const STRIP_Y = 0.06;
const STRIP_DEPTH = 1.5;
const STRIP_EMISSIVE = 2;

export function FinishGate( { track }: { track: Track } ) {
    const gate = useMemo( () => [ { z: track.finishZ, height: GATE_FRAME.height } ], [ track.finishZ ] );
    return (
        <Fragment>
            <MonolithFrames frame={ GATE_FRAME } placements={ gate } />
            <mesh position={ [ 0, STRIP_Y, track.finishZ ] } rotation={ [ -Math.PI / 2, 0, 0 ] }>
                <planeGeometry args={ [ HALF_WIDTH * 2, STRIP_DEPTH ] } />
                <meshStandardMaterial color="#0b0d0f" emissive={ ACCENT_ANCHOR } emissiveIntensity={ STRIP_EMISSIVE } />
            </mesh>
        </Fragment>
    );
}
