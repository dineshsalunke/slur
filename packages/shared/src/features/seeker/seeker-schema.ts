import { Schema, type } from '@colyseus/schema';
import type { SeekerState } from './seeker.js';

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
