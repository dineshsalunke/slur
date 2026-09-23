import { useFrame } from '@react-three/fiber';
import type { Anchor } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { accent } from './accent';
import {
    BOLT_HOT,
    boltPickupCoreGeometry,
    boltPickupGlyphGeometry,
    boltPickupShellGeometry,
    PICKUP_BOB,
    PICKUP_BOB_HZ,
    PICKUP_CORE_INTENSITY,
    PICKUP_GLYPH_INTENSITY,
    PICKUP_HOVER,
    PICKUP_POOL_RADIUS,
    PICKUP_SHELL_COLOR,
    PICKUP_SHELL_ROUGHNESS,
    PICKUP_SPIN,
} from './combat-look';
import { buildPickupPoolMaterial } from './pickup-pool-material';
import { PICKUP_REVEAL_S, type PickupPose, pickupPose } from './pickup-pose';

const _o = new THREE.Object3D();
const _pool = new THREE.Object3D();
const _pose: PickupPose = { scale: 1, lift: 0, spin: 0 };
const TAU = Math.PI * 2;

function buildLook() {
    const glyph = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    glyph.emissive = accent();
    return {
        shellGeo: boltPickupShellGeometry(),
        glyphGeo: boltPickupGlyphGeometry(),
        coreGeo: boltPickupCoreGeometry(),
        poolGeo: new THREE.PlaneGeometry( PICKUP_POOL_RADIUS * 2, PICKUP_POOL_RADIUS * 2 ).rotateX( -Math.PI / 2 ),
        shell: new THREE.MeshStandardMaterial( {
            color: PICKUP_SHELL_COLOR,
            metalness: 0,
            roughness: PICKUP_SHELL_ROUGHNESS,
            flatShading: true,
        } ),
        glyph,
        core: new THREE.MeshStandardMaterial( {
            color: '#000000',
            emissive: BOLT_HOT,
            emissiveIntensity: PICKUP_CORE_INTENSITY,
        } ),
        pool: buildPickupPoolMaterial(),
    };
}

export function BoltPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    const look = useMemo( buildLook, [] );
    const life = useMemo(
        () => ( {
            gone: new Uint8Array( layout.length ),
            since: new Float32Array( layout.length ).fill( PICKUP_REVEAL_S ),
        } ),
        [ layout ],
    );
    const shell = useRef< THREE.InstancedMesh | null >( null );
    const glyph = useRef< THREE.InstancedMesh | null >( null );
    const core = useRef< THREE.InstancedMesh | null >( null );
    const pool = useRef< THREE.InstancedMesh | null >( null );

    // Effect justified: brackets GPU resources built in useMemo, which R3F does not dispose.
    useEffect(
        () => () => {
            for ( const r of Object.values( look ) ) r.dispose();
        },
        [ look ],
    );

    useFrame( ( state, delta ) => {
        const a = shell.current;
        const b = glyph.current;
        const c = core.current;
        const d = pool.current;
        if ( ! a || ! b || ! c || ! d ) return;
        const t = state.clock.elapsedTime;
        for ( let i = 0; i < layout.length; i++ ) {
            const p = layout[ i ];
            const gone = isTaken( p.id ) ? 1 : 0;
            if ( gone !== life.gone[ i ] ) {
                life.gone[ i ] = gone;
                life.since[ i ] = 0;
            } else life.since[ i ] += delta;
            const { scale: s, lift, spin } = pickupPose( gone === 1, life.since[ i ], _pose );
            const phase = i * 1.7;
            const bob = Math.sin( t * PICKUP_BOB_HZ * TAU + phase ) * PICKUP_BOB;
            _o.position.set( p.x, p.y + PICKUP_HOVER + bob + lift, p.z );
            _o.rotation.set( 0, t * PICKUP_SPIN + phase + spin, 0 );
            _o.scale.setScalar( s );
            _o.updateMatrix();
            a.setMatrixAt( i, _o.matrix );
            b.setMatrixAt( i, _o.matrix );
            c.setMatrixAt( i, _o.matrix );
            _pool.position.set( p.x, p.y + 0.03, p.z );
            _pool.scale.setScalar( s );
            _pool.updateMatrix();
            d.setMatrixAt( i, _pool.matrix );
        }
        a.instanceMatrix.needsUpdate = true;
        b.instanceMatrix.needsUpdate = true;
        c.instanceMatrix.needsUpdate = true;
        d.instanceMatrix.needsUpdate = true;
    } );

    return (
        <group>
            <instancedMesh
                ref={ shell }
                frustumCulled={ false }
                args={ [ look.shellGeo, look.shell, layout.length ] }
            />
            <instancedMesh
                ref={ glyph }
                frustumCulled={ false }
                args={ [ look.glyphGeo, look.glyph, layout.length ] }
            />
            <instancedMesh ref={ core } frustumCulled={ false } args={ [ look.coreGeo, look.core, layout.length ] } />
            <instancedMesh
                ref={ pool }
                frustumCulled={ false }
                renderOrder={ 1 }
                args={ [ look.poolGeo, look.pool, layout.length ] }
            />
        </group>
    );
}
