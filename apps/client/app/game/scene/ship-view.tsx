import { DEFAULT_SHIP } from '@slur/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Suspense } from 'react';
import { colorHex } from '../colors';
import { Net, Render } from '../ecs/traits';
import { ShipModel } from './ship-model';

// One ship's view. Subscribes to its Net trait via useTrait so a guarded shipId/colorId change (NOT a
// per-patch update) re-renders JUST this ship and remounts its model/tint. Solo ships have no Net →
// useTrait returns undefined → the default (Fighter) model + palette colour 0. Per-frame transforms are
// written straight into the entity's Render group by the ECS systems; React is never involved in movement.
export function ShipView( { entity }: { entity: Entity } ) {
    const group = entity.get( Render );
    const net = useTrait( entity, Net );
    if ( ! group ) return null;
    const color = colorHex( net?.colorId ?? 0 );
    const shipId = net?.shipId ?? DEFAULT_SHIP;
    return (
        <primitive object={ group }>
            <Suspense fallback={ null }>
                <ShipModel key={ shipId } shipId={ shipId } color={ color } />
            </Suspense>
        </primitive>
    );
}
