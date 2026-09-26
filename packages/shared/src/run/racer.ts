import type { PlayerState } from '../schema.js';
import { tuningForShip } from '../ship-classes.js';
import { BOUNCE_MESSAGE, type BounceMessage, bounceContact } from '../sim/bounce-contact.js';
import type { PlayerInput } from '../sim/input.js';
import type { Track } from '../sim/space.js';
import { simulate } from '../sim/step.js';
import type { SimWorld } from '../sim/types.js';
import type { SimConfig } from '../sim-config.js';
import type { Broadcast } from './combat.js';

export interface RaceWorld {
    track: Track;
    config: SimConfig;
    blocks: SimWorld;
}

export function stepRacer(
    world: RaceWorld,
    player: PlayerState,
    sessionId: string,
    input: PlayerInput,
    dt: number,
    broadcast: Broadcast,
): void {
    const tuning = tuningForShip( player.shipId );
    const stunBefore = player.stunTimer;
    const vzBefore = player.vz;
    simulate( player, input, dt, tuning, world.track, world.config, world.blocks );
    player.lastProcessedInput = input.seq;
    const contact = bounceContact( player, stunBefore, vzBefore, dt, tuning );
    if ( ! contact ) return;
    const message: BounceMessage = { ...contact, victimId: sessionId };
    broadcast( BOUNCE_MESSAGE, message );
}
