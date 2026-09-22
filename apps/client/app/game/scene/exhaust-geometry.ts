import * as THREE from 'three';

const PERIMETER = 12;
const RINGS = 18;
const TAPER_POWER = 0.6;
const BULGE = 0.5;
const CORNER_EXPONENT = 4;
const TIP_MIN = 0.03;

export function slotProfile( t: number ): number {
    const taper = ( 1 - t ) ** TAPER_POWER * ( 1 + BULGE * Math.sin( Math.PI * t ) );
    return Math.max( taper, TIP_MIN );
}

function slotAxis( angle: number ): number {
    return Math.sign( angle ) * Math.abs( angle ) ** ( 2 / CORNER_EXPONENT ) * 0.5;
}

export function buildExhaustGeometry( width: number, height: number ): THREE.BufferGeometry {
    const count = RINGS * PERIMETER;
    const positions = new Float32Array( count * 3 );
    const axial = new Float32Array( count );

    for ( let ring = 0; ring < RINGS; ring++ ) {
        const t = ring / ( RINGS - 1 );
        const spread = slotProfile( t );
        for ( let i = 0; i < PERIMETER; i++ ) {
            const angle = ( i / PERIMETER ) * Math.PI * 2;
            const v = ring * PERIMETER + i;
            positions[ v * 3 ] = slotAxis( Math.cos( angle ) ) * width * spread;
            positions[ v * 3 + 1 ] = slotAxis( Math.sin( angle ) ) * height * spread;
            positions[ v * 3 + 2 ] = -t;
            axial[ v ] = t;
        }
    }

    const indices: number[] = [];
    for ( let ring = 0; ring < RINGS - 1; ring++ ) {
        for ( let i = 0; i < PERIMETER; i++ ) {
            const a = ring * PERIMETER + i;
            const b = ring * PERIMETER + ( ( i + 1 ) % PERIMETER );
            indices.push( a, a + PERIMETER, b, b, a + PERIMETER, b + PERIMETER );
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.setAttribute( 'aAxial', new THREE.BufferAttribute( axial, 1 ) );
    geometry.setIndex( indices );
    geometry.computeVertexNormals();
    return geometry;
}
