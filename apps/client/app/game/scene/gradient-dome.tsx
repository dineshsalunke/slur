import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { DomeConfig } from './env-config';

// A tiny vertical-ramp texture (top → bottom) drawn once into a canvas. Same CanvasTexture idiom the track
// grid uses. If the ramp reads upside-down when rendered, swap the two colour fields in the config.
function makeGradientTexture( top: string, bottom: string ): THREE.Texture {
    const c = document.createElement( 'canvas' );
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'gradient dome: 2d context unavailable' );
    const g = ctx.createLinearGradient( 0, 0, 0, 256 );
    g.addColorStop( 0, top );
    g.addColorStop( 1, bottom );
    ctx.fillStyle = g;
    ctx.fillRect( 0, 0, 4, 256 );
    const tex = new THREE.CanvasTexture( c );
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// A camera-locked (via SkyFollow) inner sphere painted with a vertical gradient — the "sky". BackSide so we
// see it from inside; depthWrite off so it never occludes the world; fog off so haze doesn't eat it;
// toneMapped off so the authored (deliberately sub-1.0) colours pass through without triggering bloom.
export function GradientDome( { config }: { config: DomeConfig } ) {
    const tex = useMemo( () => makeGradientTexture( config.top, config.bottom ), [ config.top, config.bottom ] );

    // JUSTIFIED EFFECT — external resource lifetime (a GPU texture we `new`'d in useMemo, not created by
    // R3F from JSX). r3f.md: manually-created resources are ours to dispose. Cleanup runs on unmount AND
    // when the colours change (variant switch), releasing the superseded texture. No render-derivation,
    // no event, no data-flow involved — purely bracketing an external resource's lifetime.
    useEffect( () => () => tex.dispose(), [ tex ] );

    return (
        <mesh scale={ config.radius }>
            <sphereGeometry args={ [ 1, 32, 16 ] } />
            <meshBasicMaterial
                map={ tex }
                side={ THREE.BackSide }
                depthWrite={ false }
                fog={ false }
                toneMapped={ false }
            />
        </mesh>
    );
}
