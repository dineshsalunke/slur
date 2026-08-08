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

    // ── S3 track/collision state (appended; the PlayerState schema mirrors these in the SAME order) ──
    dead: boolean; // true while derezzed & waiting to respawn; sim is frozen (velocity zeroed) this whole time
    respawnTimer: number; // seconds remaining until respawn while dead (counts down each step)
    invulnTimer: number; // seconds of post-respawn grace where block-death is ignored (falling still kills)
    lastSafeX: number; // last grounded lateral position — the respawn anchor (updated every landing)
    lastSafeZ: number; // last grounded forward position — the respawn anchor
    finished: boolean; // crossed the finish gate (z >= finishZ); latched once true
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
        dead: false,
        respawnTimer: 0,
        invulnTimer: 0,
        lastSafeX: x, // spawn is on safe ground, so it IS the first safe anchor
        lastSafeZ: z,
        finished: false,
    };
}
