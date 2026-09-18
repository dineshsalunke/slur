import { HALF_WIDTH, tuningForShip } from '@slur/shared';

// The Fighter's REAL footprint, read from the roster — never hand-typed. Hand-typing a ship width against
// the grid is exactly what produced the stale "Freighter 3.6u" bug that GDD §0's preamble exists to prevent.
const FIGHTER = tuningForShip( 'challenger' );
const FIGHTER_W = FIGHTER.halfW * 2;
const FIGHTER_L = FIGHTER.halfL * 2;
/**
 * Display height only. `FlightTuning` carries halfW/halfL and nothing else, because height is cosmetic —
 * bodies are solid ground-up and Y never changes kill logic (GDD §5.5). Do not quote this back as a spec.
 */
const FIGHTER_H = 1.2;

/** One track width (64u) — the ruler's rung spacing, so a subject's height reads in track-widths. */
const RUNG = HALF_WIDTH * 2;
const MAX_RUNGS = 12;
const RUNG_THICKNESS = 0.4;

/**
 * The truth-teller: the Fighter's real footprint at true scale, plus a 64u-runged ruler.
 *
 * Every scale error in the `art-handoff-v1` boards came from judging an object with no trustworthy reference
 * in frame. A monolith rendered alone tells you nothing about whether it reads as "300u"; next to a 2.6u ship
 * box and a ladder whose every rung is one full track-width, it tells you instantly.
 *
 * The ruler exists because the ship box alone fails for this lane's actual subjects: at 2.6u against a 300u
 * obelisk it is a sub-pixel speck. The rungs are the readable ladder between those two orders of magnitude.
 */
export function ScaleReference( { height, offsetX }: { height: number; offsetX: number } ) {
    const rungs = Math.min( MAX_RUNGS, Math.max( 1, Math.ceil( height / RUNG ) ) );
    // Rung thickness scales with the subject, so the ruler stays a readable bar instead of a sub-pixel
    // dashed line. Only the RUNG SPACING is a measurement (64u); the bar's own thickness is chrome, and
    // freezing it at a world constant made the ladder unreadable the moment a 300u subject pulled the
    // camera back. The ONE thing that must never scale is the Fighter box — that IS the measurement.
    const thickness = Math.max( RUNG_THICKNESS, height / 220 );

    return (
        <group>
            { /* Real collision extents (footprint IS hitbox — WYSIWYG, GDD §5.5), as a SOLID box rather
                 than a floor outline: a flat outline vanishes edge-on, which is precisely when you most
                 need it. Cold cyan so it never reads as part of the marigold world being judged. */ }
            <mesh position={ [ offsetX, FIGHTER_H / 2, 0 ] }>
                <boxGeometry args={ [ FIGHTER_W, FIGHTER_H, FIGHTER_L ] } />
                <meshStandardMaterial
                    color="#0d2a33"
                    emissive="#3BD6FF"
                    emissiveIntensity={ 0.9 }
                    toneMapped={ false }
                />
            </mesh>

            { /* Ruler: one rung per track-width of altitude. A handful of meshes — not worth instancing. */ }
            { Array.from( { length: rungs }, ( _v, i ) => (
                <mesh key={ i } position={ [ offsetX, ( i + 1 ) * RUNG, 0 ] }>
                    <boxGeometry args={ [ RUNG, thickness, thickness ] } />
                    <meshStandardMaterial
                        color="#0d2a33"
                        emissive="#3BD6FF"
                        emissiveIntensity={ i % 2 === 0 ? 0.8 : 0.3 }
                        toneMapped={ false }
                    />
                </mesh>
            ) ) }
        </group>
    );
}
