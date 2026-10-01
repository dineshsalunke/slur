import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { blockWorld } from '../../block-state';
import { FRAME_PHASE } from '../../frame/frame-phase.constants';
import { useTrack } from '../../track-context/use-track';
import { trackGround } from '../debris-ground';
import type { DebrisBody } from '../debris-physics';
import { beginTick } from '../debris-tick';
import { applyShape, meteorMaterial, meteorUniforms, tuneMeteor } from '../meteor-material';
import { useMeteorRock } from '../meteor-rock/use-meteor-rock';
import { _identity, _zero, SLOTS } from './meteor-pieces.constants';
import { _tick } from './meteor-pieces.scratch';
import { makeSlot, pieceHeat, pieceShapes, pieceTexture, spawnPending, stepSlot } from './meteor-pieces.utils';

export interface PieceBurst {
    x: number;
    y: number;
    z: number;
    qx: number;
    qy: number;
    qz: number;
    qw: number;
    scale: number;
    vx: number;
    vz: number;
}

export interface PieceShape {
    center: THREE.Vector3;
    hull: THREE.Vector3[];
    size: THREE.Vector3;
}

export interface Slot {
    live: boolean;
    born: number;
    scale: number;
    count: number;
    quat: THREE.Quaternion;
    bodies: DebrisBody[];
}

export interface Spawner {
    cursor: number;
    seed: number;
}

export function MeteorPieces() {
    const track = useTrack();
    const rock = useMeteorRock();
    const uniforms = useMemo( meteorUniforms, [] );
    const texture = useMemo( pieceTexture, [] );
    const material = useMemo( () => {
        uniforms.uPieceMats.value = texture;
        return meteorMaterial( uniforms, true );
    }, [ uniforms, texture ] );
    const geometry = useMemo( () => {
        applyShape( uniforms, rock.shape );
        const heat = new THREE.InstancedBufferAttribute( new Float32Array( SLOTS ), 1 );
        heat.setUsage( THREE.DynamicDrawUsage );
        rock.merged.setAttribute( 'aMeteorHeat', heat );
        return rock.merged;
    }, [ rock, uniforms ] );
    const shapes = useMemo( () => pieceShapes( rock ), [ rock ] );
    const slots = useMemo( () => Array.from( { length: SLOTS }, makeSlot ), [] );
    const ground = useMemo( () => trackGround( track, blockWorld.broken ), [ track ] );
    const spawner = useRef< Spawner >( { cursor: 0, seed: 1 } );
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    // JUSTIFIED EFFECT — brackets the lifetime of a GPU texture and material we built ourselves.
    useEffect(
        () => () => {
            texture.dispose();
            material.dispose();
        },
        [ texture, material ],
    );

    useFrame( ( frame, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const now = frame.clock.elapsedTime;
        tuneMeteor( uniforms, material, now );
        spawnPending( slots, shapes, spawner.current, now );
        const t = beginTick( _tick, ground, delta, frame.camera.position.z );
        const heat = geometry.getAttribute( 'aMeteorHeat' ) as THREE.InstancedBufferAttribute;
        const data = texture.image.data as Float32Array;
        const cool = Math.max( 0.05, num( 'Meteor.fractureCool' ) );
        let top = 0;
        for ( let i = 0; i < SLOTS; i++ ) {
            const slot = slots[ i ];
            const alive = stepSlot( slot, i, data, t );
            mesh.setMatrixAt( i, alive ? _identity : _zero );
            heat.setX( i, alive ? pieceHeat( now - slot.born, cool ) : 0 );
            if ( alive ) top = i + 1;
        }
        mesh.count = top;
        mesh.instanceMatrix.needsUpdate = true;
        heat.needsUpdate = true;
        texture.needsUpdate = true;
    }, FRAME_PHASE.view );

    return <instancedMesh ref={ meshRef } args={ [ geometry, material, SLOTS ] } count={ 0 } frustumCulled={ false } />;
}
