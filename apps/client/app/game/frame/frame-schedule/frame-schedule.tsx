import { Fragment } from 'react';
import { PhaseRunner } from '../phase-runner/phase-runner';
import type { FrameSchedule as Schedule } from '../schedule';

export function FrameSchedule< C >( { schedule, context }: { schedule: Schedule< C >; context: C } ) {
    return (
        <Fragment>
            { schedule.map( ( [ phase, systems ] ) => (
                <PhaseRunner key={ phase } phase={ phase } systems={ systems } context={ context } />
            ) ) }
        </Fragment>
    );
}
