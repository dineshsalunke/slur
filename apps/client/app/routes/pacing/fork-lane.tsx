import { FORK_MIN_ARM_U, FORK_MIN_SEPARATION_U, PACING_DZ } from '@slur/shared';
import { LegendSwatch } from './legend-swatch';
import { usePacingReport } from './pacing-report-context';
import { forkLabel, forkVerdict } from './route-lines';

function placeAt( seconds: number ): ( el: HTMLElement | null ) => void {
    return ( el ) => el?.style.setProperty( '--at', String( seconds ) );
}

export function ForkLane() {
    const { cruise, duration, routes, arms } = usePacingReport();
    if ( ! routes || ! arms ) return null;
    const t = ( k: number ): number => ( k * PACING_DZ ) / cruise;
    return (
        <div className="flex border-b border-line">
            <div className="sticky left-0 z-10 flex w-44 shrink-0 flex-col gap-1 border-r border-line bg-void px-3 py-2 text-[11px] text-dim">
                <div className="text-xs text-fg">Forks</div>
                <div>
                    arms ≥ { FORK_MIN_ARM_U.toFixed( 0 ) }u, ≥ { FORK_MIN_SEPARATION_U.toFixed( 1 ) }u apart
                </div>
                <LegendSwatch swatchClass="bg-marigold/40" label="real choice" />
                <LegendSwatch swatchClass="bg-threat/50" label="has a dominated arm" />
                <LegendSwatch swatchClass="bg-gold" label="ground / air fork" />
                <LegendSwatch swatchClass="bg-dim/60" label="dodge" />
            </div>
            <div className="relative h-16 w-[calc(var(--duration)*var(--pps)*1px)] shrink-0">
                <svg
                    viewBox={ `0 0 ${ duration } 1` }
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                    role="img"
                    aria-label="Forks"
                >
                    { routes.forks.map( ( f ) =>
                        f.kind === 'dodge' ? (
                            <rect
                                key={ `d${ f.split }` }
                                x={ t( f.k0 ) }
                                y={ 0.85 }
                                width={ t( f.k1 + 1 - f.k0 ) }
                                height={ 0.15 }
                                className="fill-dim/60"
                            />
                        ) : null,
                    ) }
                    { arms.forks.map( ( fa ) => {
                        const f = routes.forks[ fa.fork ];
                        return (
                            <rect
                                key={ `f${ f.split }` }
                                x={ t( f.k0 ) }
                                y={ 0.3 }
                                width={ t( f.k1 + 1 - f.k0 ) }
                                height={ 0.5 }
                                vectorEffect="non-scaling-stroke"
                                className={ `${ forkVerdict( fa ) === 'real' ? 'fill-marigold/40' : 'fill-threat/50' } ${ f.mode ? 'stroke-gold stroke-2' : 'stroke-none' }` }
                            />
                        );
                    } ) }
                </svg>
                { arms.forks.map( ( fa, i ) => (
                    <span
                        key={ fa.fork }
                        ref={ placeAt( t( routes.forks[ fa.fork ].k0 ) ) }
                        className="pointer-events-none absolute top-0.5 left-[calc(var(--at)*var(--pps)*1px)] font-mono text-[10px] text-marigold"
                    >
                        { forkLabel( i ) }
                    </span>
                ) ) }
            </div>
        </div>
    );
}
