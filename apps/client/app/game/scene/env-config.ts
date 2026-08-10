// Environment variant configs for the atmosphere lab (S6 art-pass, ADD §11).
// NOT a component — a plain data module of intuitive, tweak-live parameter blocks. `scene/environment.tsx`
// consumes ONE EnvConfig; the `/env-lab` route cycles the three with keys 1/2/3.
//
// House constraint: tube-walls are PURELY VISUAL parallax "canyon walls" placed FAR beyond the track
// half-width (HALF_WIDTH = 32 in @slur/shared). Every `walls.distance` below is > 32 by a wide margin so
// geometry can never read as an obstacle. Post-FX stays bloom-only (see BloomConfig) — no CA/vignette/noise.

// Vertical gradient backdrop (a camera-locked inner sphere). Kept dim (channels < 1) so it reads as sky,
// not a bloom source. If top/bottom look swapped when rendered, just swap the two colour strings.
export interface DomeConfig {
    enabled: boolean;
    top: string; // colour at the zenith
    bottom: string; // colour at the horizon (usually the brighter, tinted band)
    radius: number; // sphere scale (u) — larger = flatter, further-feeling sky
}

// drei <Stars> — a single instanced points cloud. Follows the camera (via SkyFollow) so the field never
// runs out as the ship travels. All fields are the raw drei props (verified against drei 10.7.8 Stars.d.ts).
export interface StarConfig {
    enabled: boolean;
    count: number; // number of stars (sparse deep-space ~1k → dense void ~6k)
    radius: number; // sphere radius the stars sit on (u)
    depth: number; // how far stars extend inward from `radius` (parallax thickness)
    factor: number; // star size factor (bigger = chunkier points)
    saturation: number; // 0 = white stars, →1 tints them
    fade: boolean; // fade distant stars into the void (softer horizon)
    speed: number; // twinkle/drift speed
}

// Linear scene fog (attach="fog"). Near/far are world units — intuitive: fog starts at `near`, fully
// opaque by `far`. Deep-space = far/loose; neon haze = near/tight and colour-tinted.
export interface FogConfig {
    color: string;
    near: number; // u — no fog closer than this
    far: number; // u — fully fogged beyond this
}

// Instanced parallax canyon walls (mirrors scenery.tsx: seeded, recycled ahead of the ship, zero re-renders).
export interface WallConfig {
    distance: number; // x from track centre to each wall (MUST be > HALF_WIDTH 32 — visual only, non-collidable)
    thickness: number; // slab footprint on x & z (u)
    minHeight: number; // seeded slab height range (u) — variation gives an organic skyline
    maxHeight: number;
    spacing: number; // z gap between successive slabs on one side (u) — smaller = denser wall
    count: number; // total slabs across BOTH sides (~count/2 per side); a hard instance-buffer cap
    color: string; // emissive hue of the slabs
    intensity: number; // emissiveIntensity — HDR > 1 so the single global Bloom catches it
    yBase: number; // bottom of the slabs (0 = standing on the floor plane)
}

// Single global Bloom pass params (the ONLY post-FX, per the locked constraint). Pushed to ~1.0–1.5 /
// threshold ~0.4 (ADD §11 — the networked scene's 0.5/0.6 was too timid).
export interface BloomConfig {
    intensity: number;
    threshold: number; // luminanceThreshold — lower = more surfaces bloom
    smoothing: number; // luminanceSmoothing — softness of the threshold knee
}

export interface EnvConfig {
    name: string;
    background: string; // <color attach="background"> — the base void colour behind everything
    fog: FogConfig;
    dome: DomeConfig;
    stars: StarConfig;
    walls: WallConfig;
    bloom: BloomConfig;
}

// ── The three variants (same hybrid structure, different mood) ────────────────────────────────────────
// A: Deep-Space Drift — sparse stars in a pure void (no dome), far/low blue walls, minimal loose fog.
// B: Neon Canyon      — closer/taller magenta walls, tight magenta haze, violet dome, medium stars.
// C: Grid Void        — dense stars, cyan-tinted haze + horizon-glow dome, mid cyan walls (leans on the
//                       existing Track neon grid as the "ground grid").
export const ENV_VARIANTS: readonly EnvConfig[] = [
    {
        name: 'A · Deep-Space Drift',
        background: '#02030a',
        fog: { color: '#02030a', near: 140, far: 640 },
        dome: { enabled: false, top: '#050a1a', bottom: '#0a1230', radius: 800 },
        stars: { enabled: true, count: 1200, radius: 320, depth: 80, factor: 4, saturation: 0, fade: true, speed: 0.4 },
        walls: {
            distance: 92,
            thickness: 4,
            minHeight: 6,
            maxHeight: 26,
            spacing: 60,
            count: 40,
            color: '#1e6fff',
            intensity: 2.2,
            yBase: 0,
        },
        bloom: { intensity: 1.0, threshold: 0.45, smoothing: 0.2 },
    },
    {
        name: 'B · Neon Canyon',
        background: '#0a0512',
        fog: { color: '#2a0a3a', near: 40, far: 300 },
        dome: { enabled: true, top: '#160826', bottom: '#3a0f4a', radius: 700 },
        stars: {
            enabled: true,
            count: 3000,
            radius: 250,
            depth: 60,
            factor: 5,
            saturation: 0.2,
            fade: true,
            speed: 0.5,
        },
        walls: {
            distance: 52,
            thickness: 5,
            minHeight: 30,
            maxHeight: 90,
            spacing: 26,
            count: 80,
            color: '#ff2bd6',
            intensity: 2.8,
            yBase: 0,
        },
        bloom: { intensity: 1.4, threshold: 0.4, smoothing: 0.25 },
    },
    {
        name: 'C · Grid Void',
        background: '#04060c',
        fog: { color: '#04101c', near: 80, far: 460 },
        dome: { enabled: true, top: '#02060e', bottom: '#08324a', radius: 750 },
        stars: {
            enabled: true,
            count: 6000,
            radius: 280,
            depth: 100,
            factor: 4.5,
            saturation: 0.1,
            fade: true,
            speed: 0.6,
        },
        walls: {
            distance: 68,
            thickness: 3,
            minHeight: 14,
            maxHeight: 40,
            spacing: 40,
            count: 60,
            color: '#00e5ff',
            intensity: 2.6,
            yBase: 0,
        },
        bloom: { intensity: 1.2, threshold: 0.42, smoothing: 0.2 },
    },
] as const;

// The LOCKED environment for the networked in-game scene (S6 identity pass, phase note
// 2026-08-10-s6-identity.md → "Environment pass — decisions"): variant "C · Grid Void". Resolved by NAME,
// not a bare index, so reordering ENV_VARIANTS above can never silently repoint the shipped world. The
// /env-lab route still cycles all three by index; only net-canvas pins this one.
export const GRID_VOID: EnvConfig = ENV_VARIANTS.find( ( v ) => v.name.startsWith( 'C ·' ) ) ?? ENV_VARIANTS[ 2 ];
