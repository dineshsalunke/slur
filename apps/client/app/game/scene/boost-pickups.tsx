import type { Anchor } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import { boostPickupCoreGeometry, boostPickupGlyphGeometry, boostPickupShellGeometry } from './boost-look';
import { BOLT_HOT, PICKUP_CORE_INTENSITY, PICKUP_GLYPH_INTENSITY } from './combat-look';
import { PickupInstances, type PickupPart } from './pickup-instances';
import { graphiteShellMaterial } from './track-materials';

function buildBoostPickup(): PickupPart[] {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return [
        { geometry: boostPickupShellGeometry(), material: graphiteShellMaterial() },
        { geometry: boostPickupGlyphGeometry(), material: glyph },
        {
            geometry: boostPickupCoreGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}

export function BoostPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildBoostPickup } />;
}
