import type { Anchor } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT, PICKUP_CORE_INTENSITY, PICKUP_GLYPH_INTENSITY } from './combat-look';
import { PickupInstances, type PickupPart } from './pickup-instances';
import { shieldPickupCoreGeometry, shieldPickupGlyphGeometry, shieldPickupShellGeometry } from './shield-look';
import { graphiteShellMaterial } from './track-materials';

function buildShieldPickup(): PickupPart[] {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return [
        { geometry: shieldPickupShellGeometry(), material: graphiteShellMaterial() },
        { geometry: shieldPickupGlyphGeometry(), material: glyph },
        {
            geometry: shieldPickupCoreGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}

export function ShieldPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildShieldPickup } />;
}
