import { areaChunks, lineChunks } from './board-scale';
import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';
import { PolylineChunks } from './polyline-chunks';
import { stepPoints } from './route-lines';

export function CorridorLane() {
    const { cruise, duration, routes } = usePacingReport();
    if ( ! routes ) return null;
    let peak = 1;
    for ( const v of routes.corridors ) peak = Math.max( peak, v );
    const points = stepPoints( routes.corridors, cruise );
    return (
        <MetricPanel
            label="Viable corridors"
            unit={ `side by side, 0 – ${ peak }` }
            heightClass="h-12"
            duration={ duration }
            yMin={ 0 }
            yMax={ peak + 0.5 }
        >
            <PolylineChunks chunks={ areaChunks( points ) } stroke={ false } className="fill-cyan/15 stroke-none" />
            <PolylineChunks chunks={ lineChunks( points ) } className="fill-none stroke-cyan stroke-1" />
        </MetricPanel>
    );
}
