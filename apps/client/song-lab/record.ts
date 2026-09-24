import { type PlayerInput, SHIP_CLASSES, type ShipClassId, type Track } from '@slur/shared';
import {
    classTuning,
    type LabRun,
    labResult,
    labStep,
    newReplay,
    packInputs,
    recordTrace,
    replayRun,
    sameResult,
} from './bundle.ts';
import { newPilot, type PilotCourse, pilotInput } from './pilot.ts';

export const LAB_CLASSES = Object.keys( SHIP_CLASSES ) as ShipClassId[];

export function recordRun( track: Track, course: PilotCourse, classId: ShipClassId ): LabRun {
    const r = newReplay();
    const tuning = classTuning( classId );
    const pilot = newPilot( course, tuning, track );
    const inputs: PlayerInput[] = [];
    while ( ! r.tally.done ) {
        const input = pilotInput( pilot, r.ship, r.world );
        input.seq = r.tally.ticks;
        inputs.push( input );
        labStep( r.ship, input, tuning, track, r.world, r.tally );
        recordTrace( r );
    }
    const run: LabRun = { classId, inputs: packInputs( inputs ), result: labResult( r ), trace: r.trace };
    if ( ! sameResult( labResult( replayRun( track, run ) ), run.result ) )
        throw new Error( `${ classId }: the replay of the recorded inputs diverged` );
    return run;
}
