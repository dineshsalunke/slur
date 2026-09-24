export const JUMP_LATCH_MS = 100;

let latchedAt = Number.NEGATIVE_INFINITY;

export function latchJump( now = performance.now() ): void {
    latchedAt = now;
}

export function takeJumpLatch( now = performance.now() ): boolean {
    const fresh = now - latchedAt <= JUMP_LATCH_MS;
    latchedAt = Number.NEGATIVE_INFINITY;
    return fresh;
}
