import { SHIP_ORDER, SHIPS, type ShipClassId, type ShipId } from '@slur/shared';
import type { LabBundle, LabResult, LabRule, LabVariant } from '../../../song-lab/bundle';
import type { LabCheck } from './lab-check';

export interface LabRow {
    classId: ShipClassId;
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
}

export function shipForClass( classId: ShipClassId ): ShipId {
    return SHIP_ORDER.find( ( s ) => SHIPS[ s ].classId === classId ) ?? SHIP_ORDER[ 0 ];
}

export function pickVariant( bundle: LabBundle, id: string | null ): LabVariant {
    return bundle.variants.find( ( v ) => v.id === id ) ?? bundle.variants[ 0 ];
}

export function pickClass( variant: LabVariant, id: string | null ): ShipClassId {
    const flown = variant.runs.map( ( r ) => r.classId );
    return flown.find( ( c ) => c === id ) ?? flown[ 0 ] ?? SHIPS[ SHIP_ORDER[ 0 ] ].classId;
}

export function labView(
    bundles: string[],
    name: string,
    bundle: LabBundle,
    variant: LabVariant,
    classId: ShipClassId,
    check: LabCheck,
): LabView {
    return {
        bundles,
        bundle: name,
        song: bundle.song.file,
        variants: bundle.variants.map( ( v ) => v.id ),
        variant: variant.id,
        label: variant.label,
        classes: variant.runs.map( ( r ) => r.classId ),
        classId,
        shipId: shipForClass( classId ),
        rules: variant.rules,
        scoreString: variant.scoreString,
        phraseStrings: variant.phraseStrings,
        digestOk: check.digestOk,
        results: variant.runs.map( ( r ) => ( {
            classId: r.classId,
            result: r.result,
            match: check.matches[ r.classId ] ?? null,
        } ) ),
    };
}

export function labHref( pick: LabPick ): string {
    const q = new URLSearchParams( { bundle: pick.bundle, variant: pick.variant, class: pick.classId } );
    return `?${ q }`;
}

export function formatResult( r: LabResult ): string {
    const deathZ = r.deathZ.length > 0 ? ` @ z ${ r.deathZ.map( ( z ) => Math.round( z ) ).join( ', ' ) }` : '';
    const time = r.time.toFixed( 2 );
    return `${ r.finished ? 'finished' : 'DNF' } · ${ time } s · ${ r.deaths } deaths${ deathZ } · ${ r.bumps } bumps`;
}
