import { HALF_WIDTH, tuningForShip } from '@slur/shared';

const FIGHTER = tuningForShip( 'challenger' );
const FIGHTER_W = FIGHTER.halfW * 2;
const FIGHTER_L = FIGHTER.halfL * 2;
const FIGHTER_H = 1.2;

const RUNG = HALF_WIDTH * 2;
const MAX_RUNGS = 12;
const RUNG_THICKNESS = 0.4;

export function ScaleReference( { height, offsetX }: { height: number; offsetX: number } ) {
    const rungs = Math.min( MAX_RUNGS, Math.max( 1, Math.ceil( height / RUNG ) ) );
    const thickness = Math.max( RUNG_THICKNESS, height / 220 );

    return (
        <group>
            <mesh position={ [ offsetX, FIGHTER_H / 2, 0 ] }>
                <boxGeometry args={ [ FIGHTER_W, FIGHTER_H, FIGHTER_L ] } />
                <meshStandardMaterial
                    color="#0d2a33"
                    emissive="#3BD6FF"
                    emissiveIntensity={ 0.9 }
                    toneMapped={ false }
                />
            </mesh>

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
