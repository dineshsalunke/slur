import { HIT_MESSAGE } from '../../combat/constants.js';
import type { FireDir } from '../../combat/fire-dir.js';
import type { MineEvent } from '../../combat/mine-hit.js';
import { targetShipsOf } from '../../combat/target-lock.js';
import type { PlayerState } from '../../schema.js';
import { stunDurationForShip, tuningForShip } from '../../ship-classes.js';
import type { RunContext } from '../define-sim-feature.js';
import { aimMine, evictOldest, mineFizzle, stepMines } from './mine.js';
import { MINE_BURST_MESSAGE } from './mine-constants.js';
import { Mine } from './mine-schema.js';

export function layMine(
    ctx: RunContext,
    _run: undefined,
    p: PlayerState,
    ownerId: string,
    _slot: number,
    dir: FireDir,
): boolean {
    const id = ctx.nextId();
    const mine = new Mine();
    const hull = tuningForShip( p.shipId );
    if ( ! aimMine( mine, p, hull, ownerId, ctx.track, ctx.broken, ctx.config, dir ) ) {
        ctx.broadcast( MINE_BURST_MESSAGE, mineFizzle( p, hull.halfL, ownerId, ctx.config, dir ) );
        return true;
    }
    evictOldest( ctx.state.mines, ownerId, ( e ) => resolveMineEvent( ctx, e ), ctx.config );
    ctx.state.mines.set( id, mine );
    return true;
}

export function settleMines( ctx: RunContext, _run: undefined, dt: number ): void {
    const { state } = ctx;
    stepMines(
        state.mines,
        targetShipsOf( state.players.entries() ),
        dt,
        ( e ) => resolveMineEvent( ctx, e ),
        ctx.config,
    );
}

export function resolveMineEvent( ctx: RunContext, event: MineEvent ): void {
    const { state, config, broadcast } = ctx;
    const { x, y, z, victimId } = event;
    const v = event.outcome === 'trigger' ? state.players.get( victimId ) : undefined;
    if ( v && ! ctx.shieldAbsorbs( v, { x, y, z, victimId } ) ) {
        v.stunTimer = stunDurationForShip( v.shipId, config, config.mineStunS );
        v.vz *= config.mineSpeedCut;
        broadcast( HIT_MESSAGE, { x, y, z, victimId } );
    }
    broadcast( MINE_BURST_MESSAGE, event );
}
