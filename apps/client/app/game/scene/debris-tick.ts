import { num } from '../../dev/tuning';
import { type DebrisBody, type DebrisGround, type DebrisParams, stepBody } from './debris-physics';
import { pushHit } from './hit-events';

const SUBSTEP = 1 / 120;
const MAX_STEPS = 8;
const BEHIND = 60;
const ABYSS = -140;
const SPARKS_PER_FRAME = 2;

export interface DebrisTick {
    steps: number;
    h: number;
    params: DebrisParams;
    ground: DebrisGround | null;
    camZ: number;
    sparks: number;
}

export function makeTick(): DebrisTick {
    return {
        steps: 1,
        h: 0,
        params: { gravity: 0, bounce: 0, friction: 0, spinDrag: 0 },
        ground: null,
        camZ: 0,
        sparks: 0,
    };
}

export function beginTick( t: DebrisTick, ground: DebrisGround, delta: number, camZ: number ): DebrisTick {
    t.steps = Math.min( MAX_STEPS, Math.max( 1, Math.ceil( delta / SUBSTEP ) ) );
    t.h = Math.min( delta, MAX_STEPS * SUBSTEP ) / t.steps;
    t.params.gravity = num( 'Break.gravity' );
    t.params.bounce = num( 'Break.bounce' );
    t.params.friction = num( 'Break.friction' );
    t.params.spinDrag = num( 'Break.spinDrag' );
    t.ground = ground;
    t.camZ = camZ;
    t.sparks = SPARKS_PER_FRAME;
    return t;
}

export function moveBody( body: DebrisBody, t: DebrisTick, life: number ): boolean {
    if ( ! body.live || ! t.ground ) return false;
    body.slam = 0;
    for ( let s = 0; s < t.steps; s++ ) stepBody( body, t.h, t.params, t.ground );
    if ( body.p.y < ABYSS || body.p.z < t.camZ - BEHIND || body.age > life ) body.live = false;
    return body.live;
}

export function sparkOnLanding( body: DebrisBody, t: DebrisTick, slam: number ): void {
    if ( body.slam <= slam || t.sparks <= 0 ) return;
    t.sparks--;
    pushHit( { x: body.contact.x, y: body.contact.y, z: body.contact.z } );
}
