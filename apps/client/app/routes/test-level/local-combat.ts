import {
    type Anchor,
    aimBolt,
    canFire,
    type Gunner,
    HeldPower,
    type ProjectileState,
    pickupsOf,
    stepBolts,
    stepPickups,
    type Track,
} from '@slur/shared';
import type { World } from 'koota';
import { blockWorld, clearBlockState } from '../../game/block-state';
import { Armed, LocalPlayer, Sim } from '../../game/ecs/traits';
import { pushHit } from '../../game/scene/hit-events';

const OWNER = 'test-level';

export const localCombat = {
    track: null as Track | null,
    pickups: [] as Anchor[],
    bolts: new Map< string, ProjectileState >(),
    taken: new Map< string, boolean >(),
    respawn: new Map< string, number >(),
    nextId: 0,
    fireQueued: false,
};

export function queueFire(): void {
    localCombat.fireQueued = true;
}

function resetFor( track: Track ): void {
    localCombat.track = track;
    localCombat.pickups = pickupsOf( track );
    localCombat.bolts.clear();
    localCombat.taken.clear();
    localCombat.respawn.clear();
    localCombat.nextId = 0;
    localCombat.fireQueued = false;
    clearBlockState();
}

function fire( me: Gunner ): void {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: OWNER, ttl: 0 };
    aimBolt( bolt, me, OWNER );
    localCombat.bolts.set( String( localCombat.nextId++ ), bolt );
    me.heldPower = HeldPower.none;
}

export function localCombatSystem( world: World, dt: number, track: Track ): void {
    if ( localCombat.track !== track ) resetFor( track );
    const ship = world.queryFirst( LocalPlayer, Sim );
    const s = ship?.get( Sim );
    if ( ! ship || ! s ) return;

    const armed = ship.has( Armed );
    const me: Gunner = {
        x: s.x,
        y: s.y,
        z: s.z,
        heldPower: armed ? HeldPower.bolt : HeldPower.none,
        stunTimer: s.stunTimer,
        dead: s.dead,
        spectating: false,
    };
    if ( localCombat.fireQueued && canFire( me ) ) fire( me );
    localCombat.fireQueued = false;

    stepBolts( localCombat.bolts, [], track, blockWorld.broken, dt, pushHit );
    stepPickups( [ me ], localCombat.pickups, localCombat.taken, localCombat.respawn, dt );

    const nowArmed = me.heldPower !== HeldPower.none;
    if ( nowArmed && ! armed ) ship.add( Armed );
    else if ( ! nowArmed && armed ) ship.remove( Armed );
}
