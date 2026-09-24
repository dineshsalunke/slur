import { SHIP_ORDER, type ShipId } from '@slur/shared';
import type { LabBundle, LabResult, LabVariant } from './lab-bundle';

export interface LabView {
    bundles: string[];
    bundle: string;
    song: string;
    variants: string[];
    variant: string;
    classes: ShipId[];
    shipId: ShipId;
    rules: string[];
    score: string;
    results: { shipId: ShipId; result: LabResult }[];
}

export interface LabPick {
    bundle: string;
    variant: string;
    shipId: ShipId;
}

export function pickVariant( bundle: LabBundle, id: string | null ): LabVariant {
    return bundle.variants.find( ( v ) => v.id === id ) ?? bundle.variants[ 0 ];
}

export function pickShip( variant: LabVariant, id: string | null ): ShipId {
    const flown = variant.runs.map( ( r ) => r.shipId );
    return flown.find( ( s ) => s === id ) ?? flown[ 0 ] ?? SHIP_ORDER[ 0 ];
}

export function labView(
    bundles: string[],
    name: string,
    bundle: LabBundle,
    variant: LabVariant,
    shipId: ShipId,
): LabView {
    return {
        bundles,
        bundle: name,
        song: bundle.song,
        variants: bundle.variants.map( ( v ) => v.id ),
        variant: variant.id,
        classes: variant.runs.map( ( r ) => r.shipId ),
        shipId,
        rules: variant.rules,
        score: variant.score,
        results: variant.runs.map( ( r ) => ( { shipId: r.shipId, result: r.result } ) ),
    };
}

export function labHref( pick: LabPick ): string {
    const q = new URLSearchParams( { bundle: pick.bundle, variant: pick.variant, class: pick.shipId } );
    return `?${ q }`;
}

export function formatResult( r: LabResult, dt: number ): string {
    const time = `${ ( r.frames * dt ).toFixed( 2 ) } s`;
    return `${ r.finished ? 'finished' : 'DNF' } · ${ time } · ${ r.deaths } deaths`;
}
