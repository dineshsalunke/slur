import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import {
    BOLT_HOT,
    PICKUP_CORE_INTENSITY,
    PICKUP_GLYPH_INTENSITY,
    PICKUP_SHELL_COLOR,
    PICKUP_SHELL_ROUGHNESS,
} from './combat-look';
import { PickupInstances, type PickupPart } from './pickup-instances';
import { seekerCanisterCoreGeometry, seekerCanisterGlyphGeometry, seekerCanisterShellGeometry } from './seeker-look';

export interface PickupLayouts {
    bolts: Anchor[];
    seekers: Anchor[];
}

export function splitPickupLayout( layout: readonly Anchor[] ): PickupLayouts {
    const out: PickupLayouts = { bolts: [], seekers: [] };
    for ( const a of layout ) ( pickupPower( a.id ) === HeldPower.seeker ? out.seekers : out.bolts ).push( a );
    return out;
}

function buildSeekerBody(): PickupPart[] {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return [
        {
            geometry: seekerCanisterShellGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: PICKUP_SHELL_COLOR,
                metalness: 0,
                roughness: PICKUP_SHELL_ROUGHNESS,
                flatShading: true,
            } ),
        },
        { geometry: seekerCanisterGlyphGeometry(), material: glyph },
        {
            geometry: seekerCanisterCoreGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}

export function SeekerPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildSeekerBody } />;
}
