// Environment variant configs. `scene/environment.tsx` consumes one; `/env-lab` cycles them with 1/2/3.
//
// The canyon walls are PURELY VISUAL parallax, so every `walls.distance` stays far beyond the track's
// HALF_WIDTH of 32 and can never read as an obstacle. Post-FX stays bloom-only — no CA, vignette or noise.

// Vertical gradient backdrop (a camera-locked inner sphere). Kept dim (channels < 1) so it reads as sky,
// not a bloom source. If top/bottom look swapped when rendered, just swap the two colour strings.
export interface DomeConfig {
    enabled: boolean;
    top: string; // colour at the zenith
    bottom: string; // colour at the horizon (usually the brighter, tinted band)
    radius: number; // sphere scale (u) — larger = flatter, further-feeling sky
}

// drei <Stars> — a single instanced points cloud that follows the camera, so the field never runs out as
// the ship travels. All fields are the raw drei props.
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

// The single global Bloom pass — the only post-FX in the stack.
export interface BloomConfig {
    intensity: number;
    threshold: number; // luminanceThreshold — lower = more surfaces bloom
    smoothing: number; // luminanceSmoothing — softness of the threshold knee
    radius: number;
    levels: number;
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
        bloom: { intensity: 1.0, threshold: 0.45, smoothing: 0.2, radius: 0.6, levels: 4 },
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
        bloom: { intensity: 1.4, threshold: 0.4, smoothing: 0.25, radius: 0.6, levels: 4 },
    },
    {
        name: 'C · Grid Void',
        background: '#04060c',
        fog: { color: '#04101c', near: 80, far: 460 },
        dome: { enabled: true, top: '#02060e', bottom: '#08324a', radius: 750 },
        stars: {
            // The shell has to sit well inside fog `far` or the haze swallows the field — at radius 280
            // against far 460 roughly half of it was gone.
            enabled: true,
            count: 8000,
            radius: 190,
            depth: 80,
            factor: 6.5,
            saturation: 0.14,
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
            color: '#c8d0d8', // TRON retone: gray-white canyon walls (structure, not accent) to match the track
            intensity: 2.6,
            yBase: 0,
        },
        bloom: { intensity: 1.2, threshold: 0.42, smoothing: 0.2, radius: 0.6, levels: 4 },
    },
] as const;

// The environment the networked scene ships. Resolved by NAME, not by index, so reordering ENV_VARIANTS
// can never silently repoint the shipped world; /env-lab still cycles all three by index.
export const GRID_VOID: EnvConfig = ENV_VARIANTS.find( ( v ) => v.name.startsWith( 'C ·' ) ) ?? ENV_VARIANTS[ 2 ];
