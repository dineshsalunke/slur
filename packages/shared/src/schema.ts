import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import { emptySlots } from './combat/combat-step.js';
import type { MineState } from './combat/mine.js';
import type { ProjectileState } from './combat/projectiles.js';
import type { SeekerState } from './combat/seeker.js';
import { DEFAULT_SHIP } from './ship-classes.js';
import { FULL_DENSITY, isTrackGen, type TrackGen } from './sim/space.js';
import type { TrackDescriptor } from './sim/track-provider.js';
import type { SimShip } from './sim/types.js';

export const ROOM_NAME = 'run';

export class PlayerState extends Schema implements SimShip {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'float32' ) vx = 0;
    @type( 'float32' ) vy = 0;
    @type( 'float32' ) vz = 0;

    @type( 'boolean' ) grounded = true;
    @type( 'uint8' ) jumpsUsed = 0;
    @type( 'boolean' ) jumpHeld = false;
    @type( 'float32' ) coyoteTimer = 0;
    @type( 'float32' ) bufferTimer = 0;

    @type( 'uint32' ) lastProcessedInput = 0;
    @type( 'boolean' ) connected = true;

    @type( 'boolean' ) dead = false;
    @type( 'float32' ) respawnTimer = 0;
    @type( 'float32' ) invulnTimer = 0;
    @type( 'float32' ) lastSafeX = 0;
    @type( 'float32' ) lastSafeZ = 0;
    @type( 'boolean' ) finished = false;
    @type( 'float32' ) finishTime = 0;

    @type( 'string' ) shipId = DEFAULT_SHIP;

    @type( 'string' ) name = '';
    @type( 'uint8' ) colorId = 0;
    @type( 'boolean' ) spectating = false;

    @type( 'float32' ) stunTimer = 0;
    @type( 'uint8' ) heldPower = 0;
    @type( [ 'uint8' ] ) slots = new ArraySchema< number >( ...emptySlots() );
    @type( 'float32' ) boostTimer = 0;
    @type( 'boolean' ) shielded = false;
    shieldTimer = 0;
    @type( 'float32' ) tugTimer = 0;
    @type( 'float32' ) slowTimer = 0;
    @type( 'float32' ) towTimer = 0;
    @type( 'float32' ) tugAnchorZ = 0;
}

export class Projectile extends Schema implements ProjectileState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'string' ) ownerId = '';
    @type( 'float32' ) ttl = 0;
    @type( 'int8' ) dir = 1;
}

export class Seeker extends Schema implements SeekerState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'float32' ) vz = 0;
    @type( 'string' ) ownerId = '';
    @type( 'string' ) targetId = '';
    @type( 'float32' ) ttl = 0;
    @type( 'boolean' ) committed = false;
    @type( 'int8' ) dir = 1;
}

export class Mine extends Schema implements MineState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'string' ) ownerId = '';
    @type( 'boolean' ) armed = false;
    ttl = 0;
}

export class TrackDescriptorState extends Schema {
    @type( 'string' ) kind = 'procgen';
    @type( 'uint32' ) seed = 0;
    @type( 'uint8' ) tier = 0;
    @type( 'uint16' ) length = 0;
    @type( 'float32' ) blockDensity = 1;
    @type( 'float32' ) gapChance = 1;
    @type( 'string' ) levelId = '';
    @type( 'string' ) gen: TrackGen = 'weave';
}

export function applyDescriptor( state: TrackDescriptorState, d: TrackDescriptor ): void {
    state.kind = d.kind;
    if ( d.kind === 'procgen' ) {
        state.seed = d.seed;
        state.tier = d.tier;
        state.length = d.length;
        state.blockDensity = d.blockDensity ?? FULL_DENSITY.blocks;
        state.gapChance = d.gapChance ?? FULL_DENSITY.gaps;
        state.gen = d.gen ?? 'weave';
    } else {
        state.levelId = d.levelId;
    }
}

export function toDescriptor( state: TrackDescriptorState ): TrackDescriptor {
    if ( state.kind === 'procgen' ) {
        return {
            kind: 'procgen',
            seed: state.seed,
            tier: state.tier,
            length: state.length,
            blockDensity: state.blockDensity,
            gapChance: state.gapChance,
            gen: isTrackGen( state.gen ) ? state.gen : 'weave',
        };
    }
    return { kind: 'authored', levelId: state.levelId };
}

export function descriptorReady( state: TrackDescriptorState ): boolean {
    return state.kind === 'procgen' ? state.seed !== 0 : state.levelId !== '';
}

export class RunState extends Schema {
    @type( 'uint8' ) phase = 0;
    @type( 'float32' ) elapsed = 0;
    @type( TrackDescriptorState ) descriptor = new TrackDescriptorState();
    @type( { map: PlayerState } ) players = new MapSchema< PlayerState >();

    @type( 'string' ) hostId = '';
    @type( 'float32' ) countdown = 0;
    @type( 'float32' ) finishDeadline = 0;

    @type( { map: Projectile } ) projectiles = new MapSchema< Projectile >();
    @type( { map: 'boolean' } ) pickupTaken = new MapSchema< boolean >();
    @type( { map: 'boolean' } ) blockBroken = new MapSchema< boolean >();
    @type( { map: Seeker } ) seekers = new MapSchema< Seeker >();
    @type( { map: Mine } ) mines = new MapSchema< Mine >();
}
