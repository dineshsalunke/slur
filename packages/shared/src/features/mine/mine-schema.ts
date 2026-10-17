import { Schema, type } from '@colyseus/schema';
import type { MineState } from '../../combat/mine-hit.js';

export class Mine extends Schema implements MineState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'string' ) ownerId = '';
    @type( 'boolean' ) armed = false;
    ttl = 0;
}
