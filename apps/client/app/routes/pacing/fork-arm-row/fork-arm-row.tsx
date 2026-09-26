import type { MouseEvent } from 'react';
import { usePacingReport } from '../pacing-report-context';
import { togglePick, useArmPicked } from '../route-selection';
import { CELL } from './fork-arm-row.constants';
import { scrollToFork } from './fork-arm-row.utils';

export interface ArmRowData {
    fork: number;
    arm: number;
    armCount: number;
    label: string;
    z: number;
    seconds: number;
    length: number;
    separation: number;
    verdict: string;
    air: boolean;
    lateral: number;
    reversals: number;
    peakStrafe: number;
    jumps: number;
    airU: number;
    gaps: number;
    stuck: number;
    barred: number;
    tags: string;
}

export function ForkArmRow( { row }: { row: ArmRowData } ) {
    const report = usePacingReport();
    const picked = useArmPicked( row.fork, row.arm );
    const onClick = ( e: MouseEvent< HTMLTableRowElement > ): void => {
        togglePick( report, row.fork, row.arm );
        scrollToFork( e.currentTarget, row.seconds );
    };
    return (
        <tr
            onClick={ onClick }
            className={ `cursor-pointer border-t border-line hover:bg-space ${ picked ? 'bg-marigold/15 text-hud' : '' }` }
        >
            { row.arm === 0 && (
                <td rowSpan={ row.armCount } className="px-2 py-0.5 align-top font-mono text-marigold">
                    { row.label }
                </td>
            ) }
            { row.arm === 0 && (
                <td rowSpan={ row.armCount } className={ `${ CELL } align-top` }>
                    { row.z.toFixed( 0 ) }u · { row.seconds.toFixed( 1 ) }s
                </td>
            ) }
            { row.arm === 0 && (
                <td rowSpan={ row.armCount } className={ `${ CELL } align-top` }>
                    { row.length.toFixed( 0 ) }u
                </td>
            ) }
            { row.arm === 0 && (
                <td rowSpan={ row.armCount } className={ `${ CELL } align-top` }>
                    { row.separation.toFixed( 1 ) }u
                </td>
            ) }
            { row.arm === 0 && (
                <td
                    rowSpan={ row.armCount }
                    className={ `px-2 py-0.5 align-top ${ row.verdict === 'real' ? 'text-fg' : 'text-threat' }` }
                >
                    { row.verdict }
                </td>
            ) }
            <td className="px-2 py-0.5 font-mono">
                { String.fromCharCode( 97 + row.arm ) }
                { row.air ? ' air' : '' }
            </td>
            <td className={ CELL }>{ row.lateral.toFixed( 0 ) }</td>
            <td className={ CELL }>{ row.reversals }</td>
            <td className={ CELL }>{ row.peakStrafe.toFixed( 0 ) }</td>
            <td className={ CELL }>{ row.jumps }</td>
            <td className={ CELL }>{ row.airU.toFixed( 0 ) }</td>
            <td className={ CELL }>{ row.gaps }</td>
            <td className={ CELL }>{ row.stuck + row.barred }</td>
            <td className="px-2 py-0.5 text-dim">{ row.tags }</td>
        </tr>
    );
}
