import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT, PICKUP_CORE_INTENSITY, PICKUP_GLYPH_INTENSITY } from './combat-look';
import { PickupInstances, type PickupPart } from './pickup-instances';
import {
    SEEKER_FLIGHT,
    SEEKER_PICKUP,
    type SeekerForm,
    seekerCoreGeometry,
    seekerGlyphGeometry,
    seekerShellGeometry,
} from './seeker-look';
import { graphiteShellMaterial } from './track-materials';

export interface PickupLayouts {
    bolts: Anchor[];
    seekers: Anchor[];
}

export function splitPickupLayout( layout: readonly Anchor[] ): PickupLayouts {
    const out: PickupLayouts = { bolts: [], seekers: [] };
    for ( const a of layout ) ( pickupPower( a.id ) === HeldPower.seeker ? out.seekers : out.bolts ).push( a );
    return out;
}

function seekerParts( form: SeekerForm ): PickupPart[] {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return [
        { geometry: seekerShellGeometry( form ), material: graphiteShellMaterial() },
        { geometry: seekerGlyphGeometry( form ), material: glyph },
        {
            geometry: seekerCoreGeometry( form ),
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}

export function buildSeekerBody(): PickupPart[] {
    return seekerParts( SEEKER_FLIGHT );
}

function buildSeekerPickup(): PickupPart[] {
    return seekerParts( SEEKER_PICKUP );
}

export function SeekerPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildSeekerPickup } />;
}
