import {
    type Anchor,
    aimBolt,
    aimMine,
    aimSeeker,
    canFire,
    DEFAULT_SHIP,
    DEFAULT_SIM_CONFIG,
    dropPower,
    emptySlots,
    evictOldest,
    type FireDir,
    type Gunner,
    HeldPower,
    lockTarget,
    type MineState,
    type ProjectileState,
    pickupsOf,
    powerIn,
    type SeekerEvent,
    type SeekerState,
    type SimConfig,
    spendPower,
    stepBolts,
    stepMines,
    stepPickups,
    stepSeekers,
    type Track,
    tuningForShip,
} from '@slur/shared';
import type { World } from 'koota';
import { playSfx } from '../../audio/sfx-map';
import { num } from '../../dev/tuning';
import { blockWorld, clearBlockState } from '../../game/block-state';
import { Held, LocalPlayer, Net, Sim } from '../../game/ecs/traits';
import { resetSlot, settleSlot } from '../../game/input/power-select';
import { pushHit } from '../../game/scene/hit-events';
import { burstMine } from '../../game/scene/mine-shock-events';
import { mineNow } from '../../game/scene/mine-shots';
import { type MineThrow, throwFrom } from '../../game/scene/mine-throw';

const OWNER = 'test-level';

export const localCombat = {
    track: null as Track | null,
    pickups: [] as Anchor[],
    bolts: new Map< string, ProjectileState >(),
    seekers: new Map< string, SeekerState >(),
    mines: new Map< string, MineState >(),
    throws: new Map< string, MineThrow >(),
    taken: new Map< string, boolean >(),
    respawn: new Map< string, number >(),
    nextId: 0,
    fireSlot: -1,
    fireDir: 1 as FireDir,
    dropSlot: -1,
};

export function queueFire( slot: number, dir: FireDir = 1 ): void {
    localCombat.fireSlot = slot;
    localCombat.fireDir = dir;
}

export function queueDrop( slot: number ): void {
    localCombat.dropSlot = slot;
}

function resetFor( track: Track ): void {
    localCombat.track = track;
    localCombat.pickups = pickupsOf( track );
    localCombat.bolts.clear();
    localCombat.seekers.clear();
    localCombat.mines.clear();
    localCombat.throws.clear();
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

function fireBolt( me: Gunner, dir: FireDir ): void {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: OWNER, ttl: 0, dir };
    aimBolt( bolt, me, OWNER, DEFAULT_SIM_CONFIG, dir );
    localCombat.bolts.set( String( localCombat.nextId++ ), bolt );
}

function seekerConfig(): SimConfig {
    return { ...DEFAULT_SIM_CONFIG, seekerFlyY: num( 'Seeker.flyY' ) };
}

function fireSeeker( me: Gunner, vz: number, track: Track, dir: FireDir ): void {
    const cfg = seekerConfig();
    const targetId = lockTarget( me, OWNER, [], track, blockWorld.broken, cfg, dir );
    const seeker: SeekerState = {
        x: 0,
        y: 0,
        z: 0,
        vz: 0,
        ownerId: '',
        targetId: '',
        ttl: 0,
        committed: false,
        dir,
    };
    aimSeeker( seeker, { x: me.x, y: me.y, z: me.z, vz }, OWNER, targetId, cfg, dir );
    localCombat.seekers.set( String( localCombat.nextId++ ), seeker );
}

function layMine( me: Gunner, vz: number, shipId: string, track: Track, dir: FireDir ): void {
    const mine: MineState = { x: 0, y: 0, z: 0, ownerId: '', armed: false, ttl: 0 };
    const layer = { x: me.x, y: me.y, z: me.z, vz };
    const tuning = tuningForShip( shipId );
    if ( ! aimMine( mine, layer, tuning, OWNER, track, blockWorld.broken, DEFAULT_SIM_CONFIG, dir ) ) return;
    evictOldest( localCombat.mines, OWNER, burstMine );
    const id = String( localCombat.nextId++ );
    localCombat.mines.set( id, mine );
    const from = { x: me.x, y: me.y, z: me.z, halfL: tuning.halfL };
    localCombat.throws.set( id, throwFrom( { bornAt: 0, fromX: 0, fromY: 0, fromZ: 0, dir }, mine, from, mineNow() ) );
}

function fire( me: Gunner, slot: number, vz: number, shipId: string, track: Track, dir: FireDir ): void {
    if ( ! canFire( me, slot ) ) return;
    const power = powerIn( me, slot );
    spendPower( me, slot );
    if ( power === HeldPower.seeker ) fireSeeker( me, vz, track, dir );
    else if ( power === HeldPower.mine ) layMine( me, vz, shipId, track, dir );
    else if ( power === HeldPower.bolt ) fireBolt( me, dir );
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
    if ( localCombat.fireSlot >= 0 ) {
        const shipId = ship.get( Net )?.shipId ?? DEFAULT_SHIP;
        fire( me, localCombat.fireSlot, s.vz, shipId, track, localCombat.fireDir );
    }
    if ( localCombat.dropSlot >= 0 ) dropPower( me, localCombat.dropSlot );
    localCombat.fireSlot = -1;
    localCombat.dropSlot = -1;

    stepBolts(
        localCombat.bolts,
        [],
        track,
        blockWorld.broken,
        dt,
        pushHit,
        DEFAULT_SIM_CONFIG,
        localCombat.mines,
        burstMine,
    );
    stepSeekers( localCombat.seekers, [], track, blockWorld.broken, dt, onSeekerEvent, seekerConfig() );
    stepMines( localCombat.mines, [], dt, burstMine );
    const beforePickups = [ ...me.slots ];
    stepPickups( [ me ], localCombat.pickups, localCombat.taken, localCombat.respawn, dt );
    if ( me.slots.some( ( p, i ) => beforePickups[ i ] === HeldPower.none && p !== HeldPower.none ) ) {
        playSfx( 'pickup' );
    }

    if ( me.slots.some( ( p, i ) => p !== held[ i ] ) ) {
        ship.set( Held, { slots: me.slots } );
        settleSlot( me.slots );
    }
}
