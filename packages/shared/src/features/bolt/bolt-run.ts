import { HIT_MESSAGE } from '../../combat/constants.js';
import type { FireDir } from '../../combat/fire-dir.js';
import { hitShipsOf } from '../../combat/projectiles.js';
import type { PlayerState } from '../../schema.js';
import { stunDurationForShip } from '../../ship-classes.js';
import type { RunContext } from '../define-sim-feature.js';
import { aimBolt, stepBolts } from './bolt.js';
import { Projectile } from './bolt-schema.js';

export function fireBolt(
    ctx: RunContext,
    _run: undefined,
    p: PlayerState,
    ownerId: string,
    _slot: number,
    dir: FireDir,
): boolean {
    const bolt = new Projectile();
    aimBolt( bolt, p, ownerId, ctx.config, dir );
    ctx.state.projectiles.set( ctx.nextId(), bolt );
    return true;
}

export function strikeBolts( ctx: RunContext, _run: undefined, dt: number ): void {
    const { state, config, broadcast } = ctx;
    stepBolts(
        state.projectiles,
        hitShipsOf( state.players.entries() ),
        ctx.track,
        ctx.broken,
        dt,
        ( strike ) => {
            const v = state.players.get( strike.victimId );
            if ( v && ctx.shieldAbsorbs( v, strike ) ) return;
            if ( v ) v.stunTimer = stunDurationForShip( v.shipId, config );
            broadcast( HIT_MESSAGE, strike );
        },
        config,
        state.mines,
        ctx.resolveMine,
    );
}
