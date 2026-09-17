import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { FIGHTER_H, FIGHTER_L, FIGHTER_W, type Subject } from './subjects';

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

            { /* Fighter footprint as a SOLID BOX set beside the subject, not a flat outline on the deck.
                 The first build used a floor plane: edge-on it vanished, and at distance it was a cyan
                 dash — so the one element that makes scale legible was the one you could not see. A box
                 has height, catches light and reads as an object to compare against. These are the real
                 collision extents (footprint IS hitbox — WYSIWYG, GDD §5.5), never a stylised marker. */ }
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
