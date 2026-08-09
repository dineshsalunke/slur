import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Suspense } from 'react';
import { LocalPlayer, Net, Render } from '../ecs/traits';
import { ShipModel } from './ship-model';

// One ship's view. Subscribes to its Net trait via useTrait so a class hot-swap (a guarded shipId change,
// NOT a per-patch update) re-renders JUST this ship and remounts its model. Solo ships have no Net →
// useTrait returns undefined → the default (Fighter) model. Per-frame transforms are written straight into
// the entity's Render group by the ECS systems; React is never involved in movement.
export function ShipView( { entity }: { entity: Entity } ) {
    const group = entity.get( Render );
    const net = useTrait( entity, Net );
    if ( ! group ) return null;
    const color = entity.has( LocalPlayer ) ? '#00e5ff' : '#ff2bd6';
    const shipId = net?.shipId ?? 'challenger';
    return (
        <primitive object={ group }>
            <Suspense fallback={ null }>
                <ShipModel key={ shipId } shipId={ shipId } color={ color } />
            </Suspense>
        </primitive>
    );
}
