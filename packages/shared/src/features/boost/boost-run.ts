import type { FireDir } from '../../combat/fire-dir.js';
import type { PlayerState } from '../../schema.js';
import type { RunContext } from '../define-sim-feature.js';
import { startBoost } from './boost-status.js';

export function fireBoost(
    ctx: RunContext,
    _run: undefined,
    p: PlayerState,
    _ownerId: string,
    _slot: number,
    _dir: FireDir,
): boolean {
    ctx.nextId();
    startBoost( p, ctx.config );
    return true;
}
