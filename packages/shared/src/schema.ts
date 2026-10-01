import { MapSchema, Schema, type SchemaType, schema, type } from '@colyseus/schema';
import type { MineState } from './combat/mine.js';
import type { PortalState } from './combat/portal.js';
import { Projectile } from './features/bolt/bolt-schema.js';
import { Seeker } from './features/seeker/seeker-schema.js';
import { PLAYER_FIELDS } from './player-fields.js';
import { FULL_DENSITY, isTrackGen, type TrackGen } from './sim/space.js';
import type { TrackDescriptor } from './sim/track-provider.js';

export { Projectile, Seeker };

export const ROOM_NAME = 'run';

export const PlayerState = schema( PLAYER_FIELDS, 'PlayerState' );

export type PlayerState = SchemaType< typeof PlayerState >;

export class Mine extends Schema implements MineState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'string' ) ownerId = '';
    @type( 'boolean' ) armed = false;
    ttl = 0;
}

export class Portal extends Schema implements PortalState {
    @type( 'float32' ) ax = 0;
    @type( 'float32' ) ay = 0;
    @type( 'float32' ) az = 0;
    @type( 'float32' ) bx = 0;
    @type( 'float32' ) by = 0;
    @type( 'float32' ) bz = 0;
    @type( 'uint8' ) ends = 0;
    @type( 'boolean' ) armA = false;
    @type( 'boolean' ) armB = false;
    @type( 'string' ) ownerId = '';
    armTimerA = 0;
    armTimerB = 0;
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
    @type( { map: Portal } ) portals = new MapSchema< Portal >();
    @type( 'float32' ) raceCap = 0;
}
