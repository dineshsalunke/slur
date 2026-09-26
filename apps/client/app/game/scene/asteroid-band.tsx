import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type AsteroidBand as Band, bandAhead } from './asteroid-config';
import { type AsteroidPlacement, forEachAsteroid } from './asteroid-field';
import { asteroidGeometry } from './asteroid-geometry';
import { AHEAD, BACK } from './track-instancing';

const SPIN_FLOOR = 0.03;
const SPIN_RANGE = 0.16;
const SPIN_REFERENCE_SIZE = 40;

const _o = new THREE.Object3D();

function writeSpin( spin: Float32Array, i: number, p: AsteroidPlacement ): void {
    const [ a, b, c ] = p.rotation;
    const x = Math.sin( a );
    const y = Math.cos( b );
    const z = Math.sin( c + a );
    const len = Math.hypot( x, y, z ) || 1;
    const direction = Math.cos( a * 3 + c ) >= 0 ? 1 : -1;
    const rate = ( SPIN_FLOOR + SPIN_RANGE * ( ( ( b + c ) / ( Math.PI * 4 ) ) % 1 ) ) * direction;
    spin[ i * 4 ] = x / len;
    spin[ i * 4 + 1 ] = y / len;
    spin[ i * 4 + 2 ] = z / len;
    spin[ i * 4 + 3 ] = rate * Math.min( 1, SPIN_REFERENCE_SIZE / p.size );
}

export function AsteroidBand( { band, material }: { band: Band; material: THREE.Material } ) {
    const meshes = useRef< ( THREE.InstancedMesh | null )[] >( [] );
    const span = useRef( { i0: Number.NaN, i1: Number.NaN } );
    const counts = useMemo( () => new Int32Array( band.variants ), [ band.variants ] );

    const variants = useMemo(
        () =>
            Array.from( { length: band.variants }, ( _, v ) => {
                const geometry = asteroidGeometry( band.key * 7919 + v * 104_729 + 17, band.detail );
                const spin = new THREE.InstancedBufferAttribute( new Float32Array( band.limit * 4 ), 4 );
                spin.setUsage( THREE.DynamicDrawUsage );
                geometry.setAttribute( 'aRockSpin', spin );
                return { geometry, spin };
            } ),
        [ band ],
    );

    const place = useMemo(
        () => ( p: AsteroidPlacement ) => {
            const mesh = meshes.current[ p.variant ];
            const i = counts[ p.variant ];
            if ( ! mesh || i >= band.limit ) return;
            const half = p.size / 2;
            _o.position.set( p.x, p.y, p.z );
            _o.rotation.set( p.rotation[ 0 ], p.rotation[ 1 ], p.rotation[ 2 ] );
            _o.scale.set( half * p.stretch[ 0 ], half * p.stretch[ 1 ], half * p.stretch[ 2 ] );
            _o.updateMatrix();
            mesh.setMatrixAt( i, _o.matrix );
            writeSpin( variants[ p.variant ].spin.array as Float32Array, i, p );
            counts[ p.variant ] = i + 1;
        },
        [ band, counts, variants ],
    );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU geometry we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            for ( const v of variants ) v.geometry.dispose();
        },
        [ variants ],
    );

    useFrame( ( state ) => {
        const z = state.camera.position.z;
        const i0 = Math.floor( ( z - BACK ) / band.spacing );
        const i1 = Math.floor( ( z + bandAhead( band, AHEAD ) ) / band.spacing );
        if ( i0 === span.current.i0 && i1 === span.current.i1 ) return;
        span.current.i0 = i0;
        span.current.i1 = i1;

        counts.fill( 0 );
        forEachAsteroid( band, i0 * band.spacing, i1 * band.spacing, place );

        for ( let v = 0; v < variants.length; v++ ) {
            const mesh = meshes.current[ v ];
            if ( ! mesh ) continue;
            const count = counts[ v ];
            mesh.count = count;
            mesh.instanceMatrix.clearUpdateRanges();
            mesh.instanceMatrix.addUpdateRange( 0, count * 16 );
            mesh.instanceMatrix.needsUpdate = true;
            const spin = variants[ v ].spin;
            spin.clearUpdateRanges();
            spin.addUpdateRange( 0, count * 4 );
            spin.needsUpdate = true;
        }
    } );

    return (
        <Fragment>
            { variants.map( ( v, index ) => (
                <instancedMesh
                    key={ v.geometry.uuid }
                    ref={ ( m ) => {
                        meshes.current[ index ] = m;
                    } }
                    args={ [ v.geometry, material, band.limit ] }
                    count={ 0 }
                    frustumCulled={ false }
                />
            ) ) }
        </Fragment>
    );
}
