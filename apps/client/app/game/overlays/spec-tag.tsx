import { SHIP_CLASSES, SHIPS } from '@slur/shared';
import { useShipChoice } from '../../ship/ship-choice';
import { STAT_AXES, statFill } from '../../ship/ship-stats';
import { LABEL } from '../../ui/field-label';

export function SpecTag( { className = '' }: { className?: string } ) {
    const ship = useShipChoice();
    const shipClass = SHIP_CLASSES[ SHIPS[ ship.id ].classId ];

    return (
        <aside
            aria-label="Ship class"
            className={ `w-[17rem] border border-b-0 border-readout/15 bg-deep px-4 pt-3 pb-4 ${ className }` }
        >
            <div className="flex items-baseline justify-between gap-3">
                <p className="m-0 text-[22px] font-bold uppercase tracking-[0.06em] text-readout">{ shipClass.name }</p>
                <span className={ `flex ${ LABEL }` }>Class</span>
            </div>
            <dl className="m-0 mt-3 grid grid-cols-[3.5ch_1fr] items-center gap-x-3 gap-y-2">
                { STAT_AXES.map( ( axis, i ) => (
                    <div key={ axis.label } className="contents">
                        <dt title={ axis.name } className={ `flex ${ LABEL }` }>
                            { axis.label }
                        </dt>
                        <dd className="m-0 h-1 bg-readout/10">
                            <div
                                className="h-full bg-marigold transition-[width] duration-300 ease-out"
                                style={ { width: `${ statFill( i, shipClass ) }%` } }
                            />
                        </dd>
                    </div>
                ) ) }
            </dl>
        </aside>
    );
}
