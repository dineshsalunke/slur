import { tuningForShip } from '@slur/shared';
import type { Entity, World } from 'koota';
import { Net, NetMine, Render } from '../ecs/traits';
import type { BoltSink } from './bolt-streaks/bolt-streaks';
import type { MineSink } from './mine-bodies';
import {
    type BodyPose,
    bodyAt,
    type MinePoint,
    type MineThrow,
    type ShotPose,
    shotAt,
    spikeAt,
    type ThrowSource,
    throwFrom,
} from './mine-throw';

const _shot: ShotPose = { x: 0, y: 0, z: 0, traveled: 0, pitch: 0, dir: 1 };
const _src: ThrowSource = { x: 0, y: 0, z: 0, halfL: 0 };
const _body: BodyPose = { visible: false, squash: 1, open: 1 };

export function mineNow(): number {
    return performance.now() / 1000;
}

export function throwSource( owner: Entity | undefined ): ThrowSource | null {
    const grp = owner?.get( Render );
    const net = owner?.get( Net );
    if ( ! grp || ! net ) return null;
    _src.x = grp.position.x;
    _src.y = grp.position.y;
    _src.z = grp.position.z;
    _src.halfL = tuningForShip( net.shipId ).halfL;
    return _src;
}

export function launchMine( mine: MinePoint & { armed: boolean }, owner: Entity | undefined ) {
    const t = throwFrom( { bornAt: 0, fromX: 0, fromY: 0, fromZ: 0, dir: 1 }, mine, throwSource( owner ), mineNow() );
    return { x: mine.x, y: mine.y, z: mine.z, armed: mine.armed, ...t };
}

export function emitMineShot( sink: BoltSink, t: MineThrow, mine: MinePoint, now: number ): void {
    const age = now - t.bornAt;
    if ( shotAt( t, mine, age, _shot ) ) sink( _shot.x, _shot.y, _shot.z, _shot.traveled, _shot.dir, _shot.pitch );
    if ( spikeAt( t, mine, age, _shot ) ) sink( _shot.x, _shot.y, _shot.z, _shot.traveled, _shot.dir, _shot.pitch );
}

export function emitMineBody( sink: MineSink, t: MineThrow, mine: MinePoint & { armed: boolean }, now: number ): void {
    sink( mine.x, mine.y, mine.z, mine.armed, bodyAt( t, now - t.bornAt, _body ) );
}

type NetMineState = MineThrow & MinePoint & { armed: boolean };

const collecting = {
    now: 0,
    shots: ( () => {} ) as BoltSink,
    bodies: ( () => {} ) as MineSink,
};

function eachShot( [ m ]: [ NetMineState ] ): void {
    emitMineShot( collecting.shots, m, m, collecting.now );
}

function eachBody( [ m ]: [ NetMineState ] ): void {
    emitMineBody( collecting.bodies, m, m, collecting.now );
}

export function collectMineShots( world: World, sink: BoltSink ): void {
    collecting.now = mineNow();
    collecting.shots = sink;
    world.query( NetMine ).readEach( eachShot );
}

export function collectMineBodies( world: World, sink: MineSink ): void {
    collecting.now = mineNow();
    collecting.bodies = sink;
    world.query( NetMine ).readEach( eachBody );
}
