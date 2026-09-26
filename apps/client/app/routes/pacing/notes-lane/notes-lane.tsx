import { REGISTER_GAP_S } from '@slur/shared';
import { Fragment } from 'react';
import { LegendSwatch } from '../legend-swatch';
import { MetricPanel } from '../metric-panel';
import { NoteRow } from '../note-row/note-row';
import { usePacingReport } from '../pacing-report-context';
import { ROW, ROW_GAP } from './notes-lane.constants';

export function NotesLane() {
    const { cruise, duration, score, line } = usePacingReport();
    return (
        <MetricPanel
            label="Notes"
            unit={ `top: easiest route · bottom: band line · ${ score.breaches } / ${ score.notes.length } breach the ${ REGISTER_GAP_S }s register gap` }
            legend={
                <Fragment>
                    <LegendSwatch swatchClass="bg-cyan" label="strafe" />
                    <LegendSwatch swatchClass="bg-marigold" label="jump" />
                    <LegendSwatch swatchClass="bg-fg" label="smash" />
                    <LegendSwatch swatchClass="bg-fg/15" label="note + register gap" />
                    <LegendSwatch swatchClass="bg-threat/40" label="breach: onset too early" />
                </Fragment>
            }
            heightClass="h-16"
            duration={ duration }
            yMin={ 0 }
            yMax={ 2 * ROW + ROW_GAP }
        >
            <NoteRow score={ score } cruise={ cruise } top={ -( 2 * ROW + ROW_GAP ) } height={ ROW } />
            { line && <NoteRow score={ line } cruise={ cruise } top={ -ROW } height={ ROW } /> }
        </MetricPanel>
    );
}
