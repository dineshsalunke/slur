import { PACING_DZ, type PacingReport } from '@slur/shared';
import type { ArmRowData } from '../fork-arm-row/fork-arm-row';
import { forkLabel, forkVerdict } from '../route-lines';

export function armRows( report: PacingReport ): ArmRowData[] {
    const { arms, routes, cruise } = report;
    if ( ! arms || ! routes ) return [];
    return arms.forks.flatMap( ( fa, i ) => {
        const f = routes.forks[ fa.fork ];
        const z = f.k0 * PACING_DZ;
        return fa.arms.map( ( a, j ) => ( {
            fork: i,
            arm: j,
            armCount: fa.arms.length,
            label: forkLabel( i ),
            z,
            seconds: z / cruise,
            length: f.length,
            separation: f.separation,
            verdict: forkVerdict( fa ),
            air: f.arms[ j ].air,
            lateral: a.lateral,
            reversals: a.reversals,
            peakStrafe: a.peakStrafe,
            jumps: a.jumps,
            airU: a.air,
            gaps: a.gaps.length,
            stuck: a.stuck,
            barred: a.barred,
            tags: [
                j === fa.easiest ? 'easiest' : '',
                j === fa.hardest ? 'hardest' : '',
                a.dominated ? 'dominated' : '',
                arms.easiest.choice[ i ] === j ? 'on easy route' : '',
                arms.hardest.choice[ i ] === j ? 'on hard route' : '',
            ]
                .filter( Boolean )
                .join( ' · ' ),
        } ) );
    } );
}
