import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { useRebuildToken } from '../../dev/use-rebuild-token';
import { type BreakEvent, drainBreaks, drainMends, settled } from './block-breaks';
import { queueBurst } from './block-burst';
import { applyDeckFinish } from './deck-finish';
import { fractureOrient, shareCells } from './fractured-block-geometry';
import { type FracturedBlockUniforms, patchFracturedBlock } from './fractured-block-shader';
import { pushHit } from './hit-events';
import { floorSurface } from './track-materials';

const SLOTS = 16;

interface Slot {
    id: number;
    until: number;
}

interface Debris {
    geometry: THREE.BufferGeometry;
    block: THREE.InstancedBufferAttribute;
    impact: THREE.InstancedBufferAttribute;
    meta: THREE.InstancedBufferAttribute;
    slots: Slot[];
    cursor: number;
}

const _m = new THREE.Matrix4();

function buildDebris( cells: THREE.BufferGeometry ): Debris {
    const geometry = shareCells( cells );
    const block = new THREE.InstancedBufferAttribute( new Float32Array( SLOTS * 4 ), 4 );
    const impact = new THREE.InstancedBufferAttribute( new Float32Array( SLOTS * 4 ), 4 );
    const meta = new THREE.InstancedBufferAttribute( new Float32Array( SLOTS * 2 ), 2 );
    geometry.setAttribute( 'aBlock', block );
    geometry.setAttribute( 'aBreak', impact );
    geometry.setAttribute( 'aBreakMeta', meta );
    const slots = Array.from( { length: SLOTS }, () => ( { id: -1, until: 0 } ) );
    return { geometry, block, impact, meta, slots, cursor: 0 };
}

function free( d: Debris, i: number ): void {
    const slot = d.slots[ i ];
    if ( slot.id >= 0 ) settled( slot.id );
    slot.id = -1;
    d.block.setXYZW( i, 0, 0, 0, 0 );
    d.block.needsUpdate = true;
}

function spawn( d: Debris, mesh: THREE.InstancedMesh, e: BreakEvent, now: number, life: number ): void {
    const i = d.cursor;
    d.cursor = ( i + 1 ) % SLOTS;
    free( d, i );
    const b = e.block;
    const cx = ( b.x0 + b.x1 ) / 2;
    const cy = ( b.y0 + b.y1 ) / 2;
    const cz = ( b.z0 + b.z1 ) / 2;
    const w = b.x1 - b.x0;
    const h = Math.max( 0.05, b.y1 - b.y0 );
    const dz = b.z1 - b.z0;
    d.slots[ i ].id = b.id;
    d.slots[ i ].until = now + life;
    mesh.setMatrixAt( i, _m.makeTranslation( cx, cy, cz ) );
    d.block.setXYZW( i, w, h, dz, fractureOrient( b.id ) );
    d.impact.setXYZW( i, now, e.x - cx, e.y - cy, e.z - cz );
    d.meta.setXY( i, e.kind, ( b.id % 997 ) * 0.37 );
    mesh.instanceMatrix.needsUpdate = true;
    d.block.needsUpdate = true;
    d.impact.needsUpdate = true;
    d.meta.needsUpdate = true;
    queueBurst( cx, cy, cz, Math.max( w, h, dz ) );
    pushHit( { x: e.x, y: e.y, z: e.z } );
}

function mend( d: Debris, id: number ): void {
    for ( let i = 0; i < SLOTS; i++ ) if ( d.slots[ i ].id === id ) free( d, i );
}

function expire( d: Debris, now: number ): boolean {
    let live = false;
    for ( let i = 0; i < SLOTS; i++ ) {
        const slot = d.slots[ i ];
        if ( slot.id < 0 ) continue;
        if ( now >= slot.until ) free( d, i );
        else live = true;
    }
    return live;
}

function tune( u: FracturedBlockUniforms, now: number ): void {
    u.uBreakTime.value = now;
    u.uBreakLife.value = num( 'Break.life' );
    u.uBreakSpeed.value = num( 'Break.speed' );
    u.uBreakSide.value = num( 'Break.side' );
    u.uBreakUp.value = num( 'Break.up' );
    u.uBreakSpin.value = num( 'Break.spin' );
    u.uBreakGravity.value = num( 'Break.gravity' );
    u.uBreakFlare.value = num( 'Break.flare' );
}

export function BlockDebris( { cells, uniforms }: { cells: THREE.BufferGeometry; uniforms: FracturedBlockUniforms } ) {
    const rebuild = useRebuildToken();
    const surface = useMemo( floorSurface, [ rebuild ] );
    const debris = useMemo( () => buildDebris( cells ), [ cells ] );
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    useFrame( ( state ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const now = state.clock.elapsedTime;
        tune( uniforms, now );
        applyDeckFinish( mesh.material as THREE.MeshStandardMaterial );
        drainMends( ( id ) => mend( debris, id ) );
        drainBreaks( ( e ) => spawn( debris, mesh, e, now, uniforms.uBreakLife.value ) );
        mesh.count = expire( debris, now ) ? SLOTS : 0;
    } );

    return (
        <instancedMesh
            ref={ meshRef }
            geometry={ debris.geometry }
            count={ 0 }
            frustumCulled={ false }
            args={ [ undefined, undefined, SLOTS ] }
        >
            <meshStandardMaterial { ...surface } ref={ ( m ) => m && patchFracturedBlock( m, uniforms, true ) } />
        </instancedMesh>
    );
}
