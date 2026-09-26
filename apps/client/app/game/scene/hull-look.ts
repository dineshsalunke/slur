import type * as THREE from 'three';
import { col, num } from '../../dev/tuning';

export function applyHullLook( hulls: readonly THREE.MeshStandardMaterial[], tinted: { current: string } ): void {
    const base = col( 'Metal.baseColor' );
    if ( base !== tinted.current ) {
        for ( const hull of hulls ) hull.color.set( base );
        tinted.current = base;
    }
    const envMapIntensity = num( 'Ship.envMapIntensity' );
    const normalScale = num( 'Deck.normalScale' );
    for ( const hull of hulls ) {
        hull.envMapIntensity = envMapIntensity;
        hull.normalScale.set( normalScale, normalScale );
    }
}
