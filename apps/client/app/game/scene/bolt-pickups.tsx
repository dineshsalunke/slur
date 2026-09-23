import type { Anchor } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import {
    BOLT_HOT,
    boltPickupCoreGeometry,
    boltPickupGlyphGeometry,
    boltPickupShellGeometry,
    PICKUP_CORE_INTENSITY,
    PICKUP_GLYPH_INTENSITY,
    PICKUP_SHELL_COLOR,
    PICKUP_SHELL_ROUGHNESS,
} from './combat-look';
import { PickupInstances, type PickupPart } from './pickup-instances';

function buildBoltBody(): PickupPart[] {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return [
        {
            geometry: boltPickupShellGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: PICKUP_SHELL_COLOR,
                metalness: 0,
                roughness: PICKUP_SHELL_ROUGHNESS,
                flatShading: true,
            } ),
        },
        { geometry: boltPickupGlyphGeometry(), material: glyph },
        {
            geometry: boltPickupCoreGeometry(),
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}

export function BoltPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildBoltBody } />;
}
