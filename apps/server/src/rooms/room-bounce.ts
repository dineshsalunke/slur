import {
    BOUNCE_MESSAGE,
    type BounceMessage,
    bounceContact,
    type PlayerInput,
    type PlayerState,
    type SimConfig,
    type SimWorld,
    simulate,
    type Track,
    tuningForShip,
} from '@slur/shared';
import type { Broadcast } from './room-combat.js';

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
