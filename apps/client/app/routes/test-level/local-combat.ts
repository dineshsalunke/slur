import {
    type Anchor,
    aimBolt,
    aimSeeker,
    canFire,
    DEFAULT_SIM_CONFIG,
    dropPower,
    emptySlots,
    type Gunner,
    HeldPower,
    lockTarget,
    type ProjectileState,
    pickupsOf,
    powerIn,
    type SeekerEvent,
    type SeekerState,
    type SimConfig,
    seekerReady,
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
import { resetSlot, settleSlot } from '../../game/input/power-select';
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
    fireSlot: -1,
    dropSlot: -1,
};

export function queueFire( slot: number ): void {
    localCombat.fireSlot = slot;
}

export function queueDrop( slot: number ): void {
    localCombat.dropSlot = slot;
}

function resetFor( track: Track ): void {
    localCombat.track = track;
    localCombat.pickups = pickupsOf( track );
    localCombat.bolts.clear();
    localCombat.seekers.clear();
    localCombat.taken.clear();
    localCombat.respawn.clear();
    localCombat.nextId = 0;
    localCombat.fireSlot = -1;
    localCombat.dropSlot = -1;
    clearBlockState();
}

export function restartLocalCombat( world: World, track: Track ): void {
    resetFor( track );
    for ( const ship of world.query( LocalPlayer, Held ) ) ship.set( Held, { slots: emptySlots() } );
    resetSlot();
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

function fire( me: Gunner, slot: number, vz: number, track: Track ): void {
    if ( ! canFire( me, slot ) ) return;
    const seeker = powerIn( me, slot ) === HeldPower.seeker;
    if ( seeker && ! seekerReady( OWNER, localCombat.seekers.values() ) ) return;
    spendPower( me, slot );
    if ( seeker ) fireSeeker( me, vz, track );
    else fireBolt( me );
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

    const held = ship.get( Held )?.slots ?? emptySlots();
    const me: Gunner = {
        x: s.x,
        y: s.y,
        z: s.z,
        slots: [ ...held ],
        stunTimer: s.stunTimer,
        dead: s.dead,
        spectating: false,
    };
    if ( localCombat.fireSlot >= 0 ) fire( me, localCombat.fireSlot, s.vz, track );
    if ( localCombat.dropSlot >= 0 ) dropPower( me, localCombat.dropSlot );
    localCombat.fireSlot = -1;
    localCombat.dropSlot = -1;

    stepBolts( localCombat.bolts, [], track, blockWorld.broken, dt, pushHit );
    stepSeekers( localCombat.seekers, [], track, blockWorld.broken, dt, onSeekerEvent, seekerConfig() );
    stepPickups( [ me ], localCombat.pickups, localCombat.taken, localCombat.respawn, dt );

    if ( me.slots.some( ( p, i ) => p !== held[ i ] ) ) {
        ship.set( Held, { slots: me.slots } );
        settleSlot( me.slots );
    }
}
