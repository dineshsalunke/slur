import { Schema, type } from '@colyseus/schema';
import type { ProjectileState } from '../../combat/projectiles.js';

export class Projectile extends Schema implements ProjectileState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'string' ) ownerId = '';
    @type( 'float32' ) ttl = 0;
    @type( 'int8' ) dir = 1;
}
