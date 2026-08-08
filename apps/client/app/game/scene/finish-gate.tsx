import { HALF_WIDTH, type Track } from '@slur/shared';
import * as THREE from 'three';

// Static neon finish arch at track.finishZ — two pillars, a top bar, and a translucent curtain across
// the corridor. Purely presentational (the sim latches `finished` on z-cross); re-renders only if
// finishZ changes, which it never does for a room.
const H = 14; // arch height (units)
const W = HALF_WIDTH * 2 + 4; // spans the full corridor plus a little overhang

export function FinishGate( { track }: { track: Track } ) {
    return (
        <group position={ [ 0, 0, track.finishZ ] }>
            { [ -HALF_WIDTH - 1, HALF_WIDTH + 1 ].map( ( x ) => (
                <mesh key={ x } position={ [ x, H / 2, 0 ] }>
                    <boxGeometry args={ [ 1.5, H, 1.5 ] } />
                    <meshStandardMaterial emissive="#39ff14" emissiveIntensity={ 2.4 } toneMapped={ false } />
                </mesh>
            ) ) }
            <mesh position={ [ 0, H, 0 ] }>
                <boxGeometry args={ [ W, 1.5, 1.5 ] } />
                <meshStandardMaterial emissive="#39ff14" emissiveIntensity={ 2.4 } toneMapped={ false } />
            </mesh>
            <mesh position={ [ 0, H / 2, 0 ] }>
                <planeGeometry args={ [ W - 2, H ] } />
                <meshStandardMaterial
                    emissive="#39ff14"
                    emissiveIntensity={ 0.5 }
                    color="#0a2a08"
                    transparent
                    opacity={ 0.22 }
                    side={ THREE.DoubleSide }
                    toneMapped={ false }
                />
            </mesh>
        </group>
    );
}
