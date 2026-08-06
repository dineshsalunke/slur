// SimShip — the plain, framework-free simulation state. In S2 the Colyseus PlayerState schema
// declares these SAME fields, so a Schema instance structurally satisfies SimShip → identical
// sim server-side, zero rework. Keep field names EXACTLY as-is. Banking is render-only (from vx),
// deliberately NOT a sim field.

export interface SimShip {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    energy: number;
    grounded: boolean;
    jumpsUsed: number;
    jumpHeld: boolean;
    coyoteTimer: number;
    bufferTimer: number;
}

export function spawnShip( x = 0, z = 0 ): SimShip {
    return {
        x,
        y: 0,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        energy: 100,
        grounded: true,
        jumpsUsed: 0,
        jumpHeld: false,
        coyoteTimer: 0,
        bufferTimer: 0,
    };
}
