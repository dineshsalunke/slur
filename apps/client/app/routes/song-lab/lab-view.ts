import { SHIP_ORDER, SHIPS, type ShipClassId, type ShipId } from '@slur/shared';
import type { LabBundle, LabResult, LabRule, LabRun, LabSkill, LabVariant } from '../../../song-lab/bundle';
import type { LabCheck } from './lab-check';

export type LabPilot = 'perfect' | LabSkill;

export const PILOTS: LabPilot[] = [ 'perfect', 'pro', 'club', 'rookie' ];

export interface LabEntry {
    key: string;
    classId: ShipClassId;
    pilot: LabPilot;
    run: LabRun;
}

export interface LabRow {
    key: string;
    classId: ShipClassId;
    pilot: LabPilot;
    result: LabResult;
    match: boolean | null;
}

export interface LabView {
    bundles: string[];
    bundle: string;
    song: string;
    variants: string[];
    variant: string;
    label: string;
    classes: ShipClassId[];
    classId: ShipClassId;
    pilots: LabPilot[];
    pilot: LabPilot;
    key: string;
    shipId: ShipId;
    rules: LabRule[];
    scoreString: string;
    phraseStrings: string[];
    digestOk: boolean;
    results: LabRow[];
}

export interface LabPick {
    bundle: string;
    variant: string;
    classId: ShipClassId;
    pilot: LabPilot;
}

export function runKey( classId: ShipClassId, pilot: LabPilot ): string {
    return `${ classId }/${ pilot }`;
}

export function labEntries( v: LabVariant ): LabEntry[] {
    const perfect = v.runs.map( ( run ) => ( { classId: run.classId, pilot: 'perfect' as LabPilot, run } ) );
    const human = ( v.humanRuns ?? [] ).map( ( run ) => ( { classId: run.classId, pilot: run.pilot.skill, run } ) );
    const all = [ ...perfect, ...human ];
    const order = unique( all.map( ( e ) => e.classId ) );
    return all
        .map( ( e ) => ( { ...e, key: runKey( e.classId, e.pilot ) } ) )
        .sort(
            ( a, b ) =>
                order.indexOf( a.classId ) - order.indexOf( b.classId ) ||
                PILOTS.indexOf( a.pilot ) - PILOTS.indexOf( b.pilot ),
        );
}

export function shipForClass( classId: ShipClassId ): ShipId {
    return SHIP_ORDER.find( ( s ) => SHIPS[ s ].classId === classId ) ?? SHIP_ORDER[ 0 ];
}

export function pickVariant( bundle: LabBundle, id: string | null ): LabVariant {
    return bundle.variants.find( ( v ) => v.id === id ) ?? bundle.variants[ 0 ];
}

export function pickEntry( entries: LabEntry[], classId: string | null, pilot: string | null ): LabEntry | undefined {
    const ofClass = entries.filter( ( e ) => e.classId === classId );
    const pool = ofClass.length > 0 ? ofClass : entries;
    return pool.find( ( e ) => e.pilot === pilot ) ?? pool.find( ( e ) => e.pilot === 'perfect' ) ?? pool[ 0 ];
}

function unique< T >( items: T[] ): T[] {
    return [ ...new Set( items ) ];
}

export function labView(
    bundles: string[],
    name: string,
    bundle: LabBundle,
    variant: LabVariant,
    entries: LabEntry[],
    picked: LabEntry | undefined,
    check: LabCheck,
): LabView {
    const classId = picked?.classId ?? SHIPS[ SHIP_ORDER[ 0 ] ].classId;
    const pilot = picked?.pilot ?? 'perfect';
    return {
        bundles,
        bundle: name,
        song: bundle.song.file,
        variants: bundle.variants.map( ( v ) => v.id ),
        variant: variant.id,
        label: variant.label,
        classes: unique( entries.map( ( e ) => e.classId ) ),
        classId,
        pilots: PILOTS.filter( ( p ) => entries.some( ( e ) => e.classId === classId && e.pilot === p ) ),
        pilot,
        key: runKey( classId, pilot ),
        shipId: shipForClass( classId ),
        rules: variant.rules,
        scoreString: variant.scoreString,
        phraseStrings: variant.phraseStrings,
        digestOk: check.digestOk,
        results: entries.map( ( e ) => ( {
            key: e.key,
            classId: e.classId,
            pilot: e.pilot,
            result: e.run.result,
            match: check.matches[ e.key ] ?? null,
        } ) ),
    };
}

export function labHref( pick: LabPick ): string {
    const q = new URLSearchParams( {
        bundle: pick.bundle,
        variant: pick.variant,
        class: pick.classId,
        pilot: pick.pilot,
    } );
    return `?${ q }`;
}

export function formatResult( r: LabResult ): string {
    const deathZ = r.deathZ.length > 0 ? ` @ z ${ r.deathZ.map( ( z ) => Math.round( z ) ).join( ', ' ) }` : '';
    const time = r.time.toFixed( 2 );
    return `${ r.finished ? 'finished' : 'DNF' } · ${ time } s · ${ r.deaths } deaths${ deathZ } · ${ r.bumps } bumps`;
}

export function formatShort( r: LabResult ): string {
    return `${ r.finished ? '' : 'DNF ' }${ r.time.toFixed( 1 ) } s · ${ r.deaths } d · ${ r.bumps } b`;
}
