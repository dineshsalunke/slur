import { MetricPanel } from './metric-panel';
import { usePacingReport } from './pacing-report-context';

const BAR_GAP_S = 0.12;

export function LateralBars() {
    const { duration, demand } = usePacingReport();
    const peak = Math.max( 1, ...demand.bins.map( ( b ) => b.lateral ) );
    const top = Math.ceil( peak / 10 ) * 10;
    return (
        <MetricPanel
            label="Lateral travel"
            unit={ `u per second, 0 – ${ top }` }
            heightClass="h-20"
            duration={ duration }
            yMin={ 0 }
            yMax={ top }
        >
            { demand.bins.map( ( b ) => (
                <rect
                    key={ b.t0 }
                    x={ b.t0 + BAR_GAP_S / 2 }
                    y={ -b.lateral }
                    width={ Math.max( 0, b.t1 - b.t0 - BAR_GAP_S ) }
                    height={ b.lateral }
                    className="fill-cyan/70"
                />
            ) ) }
        </MetricPanel>
    );
}
