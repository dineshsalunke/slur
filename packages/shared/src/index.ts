// @slur/shared — framework-free simulation + tuning shared by client (S1) and server (S2).
// Never import @colyseus/schema from the sim; the schema will structurally match SimShip in S2.

export * from './combat/constants.js';
export * from './combat/pickups.js';
export * from './combat/projectiles.js';
export * from './constants.js';
export * from './race/director.js';
export * from './schema.js';
export * from './ship-classes.js';
export * from './sim/fixed-step.js';
export * from './sim/input.js';
export * from './sim/noise.js';
export * from './sim/rng.js';
export * from './sim/step.js';
export * from './sim/track.js';
export * from './sim/track-provider.js';
export * from './sim/types.js';
export * from './sim-config.js';
