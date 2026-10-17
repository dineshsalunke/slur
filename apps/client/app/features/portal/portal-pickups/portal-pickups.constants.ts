import type { RingSpec, SleeveSpec } from '../portal-ring';

export const PICKUP_RING: RingSpec = { inner: 0.66, outer: 0.98, depth: 0.34, wedges: 16, seam: 0.035, bevel: 0.03 };
export const PICKUP_SLEEVE: SleeveSpec = { inset: -0.025, reach: 0.085, proud: 0.008 };
export const PICKUP_DASH = 0.55;
export const PICKUP_LINK = ( PICKUP_RING.inner + PICKUP_RING.outer ) / 4;
export const PICKUP_TILT = 0.35;
