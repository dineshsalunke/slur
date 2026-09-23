import {
    type Anchor,
    aimBolt,
    aimSeeker,
    canFire,
    DEFAULT_SIM_CONFIG,
    type Gunner,
    HeldPower,
    lockTarget,
    type ProjectileState,
    pickupsOf,
    type SeekerEvent,
    type SeekerState,
    type SimConfig,
    spendPower,
    stepBolts,
    stepPickups,
    stepSeekers,
    type Track,
} from '@slur/shared';
import type { World } from 'koota';
import { num } from '../../dev/tuning';
import { blockWorld, clearBlockState } from '../../game/block-state';
import { Held, LocalPlayer, Sim } from '../../game/ecs/traits';
import { pushHit } from '../../game/scene/hit-events';

const OWNER = 'test-level';

export const localCombat = {
    track: null as Track | null,
    pickups: [] as Anchor[],
    bolts: new Map< string, ProjectileState >(),
    seekers: new Map< string, SeekerState >(),
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
    localCombat.seekers.clear();
    localCombat.taken.clear();
    localCombat.respawn.clear();
    localCombat.nextId = 0;
    localCombat.fireQueued = false;
    clearBlockState();
}

export function restartLocalCombat( world: World, track: Track ): void {
    resetFor( track );
    for ( const ship of world.query( LocalPlayer, Held ) ) ship.set( Held, { power: HeldPower.none } );
}

function fireBolt( me: Gunner ): void {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: OWNER, ttl: 0 };
    aimBolt( bolt, me, OWNER );
    localCombat.bolts.set( String( localCombat.nextId++ ), bolt );
}

function seekerConfig(): SimConfig {
    return { ...DEFAULT_SIM_CONFIG, seekerFlyY: num( 'Seeker.flyY' ) };
}

function fireSeeker( me: Gunner, vz: number, track: Track ): void {
    const cfg = seekerConfig();
    const targetId = lockTarget( me, OWNER, [], track, blockWorld.broken, cfg );
    const seeker: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false };
    aimSeeker( seeker, { x: me.x, y: me.y, z: me.z, vz }, OWNER, targetId, cfg );
    localCombat.seekers.set( String( localCombat.nextId++ ), seeker );
}

function onSeekerEvent( e: SeekerEvent ): void {
    if ( e.outcome !== 'miss' ) pushHit( { x: e.x, y: e.y, z: e.z } );
}

export function localCombatSystem( world: World, dt: number, track: Track ): void {
    if ( localCombat.track !== track ) resetFor( track );
    const ship = world.queryFirst( LocalPlayer, Sim );
    const s = ship?.get( Sim );
    if ( ! ship || ! s ) return;
    if ( ! ship.has( Held ) ) ship.add( Held );

    const held = ship.get( Held )?.power ?? HeldPower.none;
    const me: Gunner = {
        x: s.x,
        y: s.y,
        z: s.z,
        slots: [ held, HeldPower.bolt, HeldPower.bolt ],
        stunTimer: s.stunTimer,
        dead: s.dead,
        spectating: false,
    };
    if ( localCombat.fireQueued && canFire( me, 0 ) ) {
        if ( spendPower( me, 0 ) === HeldPower.seeker ) fireSeeker( me, s.vz, track );
        else fireBolt( me );
    }
    localCombat.fireQueued = false;

    stepBolts( localCombat.bolts, [], track, blockWorld.broken, dt, pushHit );
    stepSeekers( localCombat.seekers, [], track, blockWorld.broken, dt, onSeekerEvent, seekerConfig() );
    stepPickups( [ me ], localCombat.pickups, localCombat.taken, localCombat.respawn, dt );

    if ( me.slots[ 0 ] !== held ) ship.set( Held, { power: me.slots[ 0 ] } );
}
