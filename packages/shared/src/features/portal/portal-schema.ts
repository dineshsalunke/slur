import { Schema, type } from '@colyseus/schema';
import type { PortalState } from './portal-hop.js';

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
