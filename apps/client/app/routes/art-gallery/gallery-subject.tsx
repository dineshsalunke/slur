import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { FIGHTER_H, FIGHTER_L, FIGHTER_W, type Subject } from './subjects';

const TURN_SPEED = 0.35;

export function GallerySubject( { subject, position }: { subject: Subject; position: [ number, number, number ] } ) {
    const spin = useRef< Group >( null );

    useFrame( ( _state, delta ) => {
        const g = spin.current;
        if ( g ) g.rotation.y += TURN_SPEED * delta;
    } );

    return (
        <group position={ position }>
            <group ref={ spin }>{ subject.node }</group>

            <mesh position={ [ 0, FIGHTER_H / 2, -FIGHTER_L * 3 ] }>
                <boxGeometry args={ [ FIGHTER_W, FIGHTER_H, FIGHTER_L ] } />
                <meshStandardMaterial
                    color="#0d2a33"
                    emissive="#3BD6FF"
                    emissiveIntensity={ 0.9 }
                    toneMapped={ false }
                />
            </mesh>
        </group>
    );
}
