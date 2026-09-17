import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { FIGHTER_L, FIGHTER_W, type Subject } from './subjects';

const TURN_SPEED = 0.35; // rad/s — slow enough to read a silhouette, fast enough to show every face

/**
 * One subject on a turntable, with the Fighter's real footprint outlined beside it.
 *
 * The scale reference is the point. A block rendered alone tells you nothing about whether it reads as
 * "8u tall" — next to a 2.6 × 2.52u ship footprint it tells you immediately. Every scale error in the
 * `art-handoff-v1` boards came from judging an object without a trustworthy reference in frame.
 */
export function GallerySubject( { subject, position }: { subject: Subject; position: [ number, number, number ] } ) {
    const spin = useRef< Group >( null );

    // Per-frame rotation via ref mutation — never React state (r3f hot-path rule: no setState in useFrame).
    useFrame( ( _state, delta ) => {
        const g = spin.current;
        if ( g ) g.rotation.y += TURN_SPEED * delta;
    } );

    return (
        <group position={ position }>
            <group ref={ spin }>{ subject.node }</group>

            { /* Fighter footprint, outlined flat on the deck. This is the collision box, not a stylised
                 marker — footprint IS hitbox (WYSIWYG, GDD §5.5), so it is honest about scale. */ }
            <mesh position={ [ 0, -0.02, 0 ] } rotation={ [ -Math.PI / 2, 0, 0 ] }>
                <planeGeometry args={ [ FIGHTER_W, FIGHTER_L ] } />
                <meshBasicMaterial color="#3BD6FF" transparent opacity={ 0.55 } toneMapped={ false } />
            </mesh>
        </group>
    );
}
