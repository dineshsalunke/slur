// Deterministic seeded PRNG + per-segment hash. Load-bearing for S3: track geometry is COMPUTED
// from the room seed on both client and server, so the generator must produce byte-identical output
// across JS engines. That rules out transcendentals (Math.sin/cos/pow can differ by an ULP between a
// browser and Node) — everything here is pure 32-bit integer ops (Math.imul + shifts), which are
// exact and identical everywhere.

// mulberry32 — canonical public-domain PRNG (bryc, github.com/bryc/code jshash/PRNGs.md, verified
// 2026-08-08). Constants are load-bearing: a=+0x6D2B79F5; imul(a^a>>>15, 1|a); imul(t^t>>>7, 61|t);
// ^t; (t^t>>>14)>>>0 / 2^32. Returns a stateful generator in [0, 1). Seed is coerced to uint32.
export function mulberry32( seed: number ): () => number {
    let a = seed | 0;
    return () => {
        a |= 0;
        a = ( a + 0x6d2b79f5 ) | 0;
        let t = Math.imul( a ^ ( a >>> 15 ), 1 | a );
        t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
        return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
    };
}

// hash2 — mix two 32-bit integers (seed, index) → a well-avalanched uint32, used to seed a LOCAL
// mulberry32 per segment. This is what makes segmentAt(seed, i) O(1) random-access: each segment
// seeds its own independent stream from hash2(seed, i) rather than advancing one global generator
// (which would make segmentAt O(i) and non-random-access). MurmurHash3-style finalizer, all int ops.
export function hash2( seed: number, i: number ): number {
    let h = ( seed ^ 0x9e3779b9 ) | 0;
    h = Math.imul( h ^ ( i | 0 ), 0x85ebca6b );
    h = ( h << 13 ) | ( h >>> 19 );
    h = Math.imul( h ^ ( h >>> 16 ), 0x27d4eb2f );
    h = Math.imul( h ^ ( h >>> 13 ), 0x165667b1 );
    return ( h ^ ( h >>> 16 ) ) >>> 0;
}
