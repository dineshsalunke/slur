import { FIXED_DT, type ShipClassId, type Track } from '@slur/shared';
import { fnv1a, type LabHumanRun, type LabPilotSpec, type LabSkill } from './bundle.ts';
import { type PilotCourse, pilotInput } from './pilot.ts';
import { classPilot, flyRun } from './record.ts';

export const AIM_DRIFT_S = 0.5;
export const AIM_HOLD_TICKS = 15;

export const LAB_SKILLS: Record< LabSkill, Omit< LabPilotSpec, 'skill' | 'seed' > > = {
    pro: { reactTicks: 9, aimSigma: 0.4, takeoffJitter: 6 },
    club: { reactTicks: 15, aimSigma: 0.9, takeoffJitter: 12 },
    rookie: { reactTicks: 21, aimSigma: 1.6, takeoffJitter: 20 },
};

export const LAB_SKILL_IDS = Object.keys( LAB_SKILLS ) as LabSkill[];

export function mulberry32( seed: number ): () => number {
    let a = seed >>> 0;
    return () => {
        a = ( a + 0x6d2b79f5 ) >>> 0;
        let t = a;
        t = Math.imul( t ^ ( t >>> 15 ), t | 1 );
        t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 );
        return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
    };
}

function gaussian( rand: () => number ): () => number {
    return () => Math.sqrt( -2 * Math.log( 1 - rand() ) ) * Math.cos( 2 * Math.PI * rand() );
}

export function humanSeed( variant: string, seed: number, classId: ShipClassId, skill: LabSkill ): number {
    return fnv1a( `${ variant }/${ seed }/${ classId }/${ skill }` );
}

export function pilotSpec( skill: LabSkill, seed: number ): LabPilotSpec {
    return { skill, seed, ...LAB_SKILLS[ skill ] };
}

export function recordHumanRun(
    track: Track,
    course: PilotCourse,
    classId: ShipClassId,
    spec: LabPilotSpec,
): LabHumanRun {
    const rand = mulberry32( spec.seed );
    const gauss = gaussian( rand );
    const pilot = classPilot( track, course, classId );
    pilot.takeoffShift = () => ( rand() * 2 - 1 ) * spec.takeoffJitter;
    const k = ( AIM_HOLD_TICKS * FIXED_DT ) / AIM_DRIFT_S;
    const kick = spec.aimSigma * Math.sqrt( k * ( 2 - k ) );
    pilot.lag = spec.reactTicks * FIXED_DT;
    const run = flyRun( track, classId, ( r ) => {
        if ( r.tally.ticks % AIM_HOLD_TICKS === 0 ) pilot.aim = pilot.aim * ( 1 - k ) + kick * gauss();
        return pilotInput( pilot, r.ship, r.world );
    } );
    return { ...run, pilot: spec };
}
