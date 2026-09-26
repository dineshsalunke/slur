export const SHIP_HINT = { keys: [ 'A', 'D' ], does: 'Ship' } as const;
export const HOST_HINTS = [ SHIP_HINT, { keys: [ 'Enter' ], does: 'Go' } ] as const;
export const GUEST_HINTS = [ SHIP_HINT ] as const;
