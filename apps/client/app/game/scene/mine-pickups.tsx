import type { Anchor } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT, PICKUP_CORE_INTENSITY, PICKUP_GLYPH_INTENSITY } from './combat-look';
import { minePickupCoreGeometry, minePickupGlyphGeometry, minePickupShellGeometry } from './mine-look';
import { PickupInstances, type PickupPart } from './pickup-instances';
import { graphiteShellMaterial } from './track-materials';

function buildMinePickup(): PickupPart[] {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return [
        { geometry: minePickupShellGeometry(), material: graphiteShellMaterial() },
        { geometry: minePickupGlyphGeometry(), material: glyph },
        {
            geometry: minePickupCoreGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}

export function MinePickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildMinePickup } />;
}
