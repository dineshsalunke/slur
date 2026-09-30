const fr = Math.fround;
const K0 = fr( 0.1031 );
const K1 = fr( 0.103 );
const K2 = fr( 0.0973 );
const K3 = fr( 33.33 );

function fract( value: number ): number {
    return fr( value - Math.floor( value ) );
}

export function hash31( x: number, y: number, z: number ): number {
    let qx = fract( fr( x * K0 ) );
    let qy = fract( fr( y * K1 ) );
    let qz = fract( fr( z * K2 ) );
    const d = fr( fr( fr( qx * fr( qy + K3 ) ) + fr( qy * fr( qz + K3 ) ) ) + fr( qz * fr( qx + K3 ) ) );
    qx = fr( qx + d );
    qy = fr( qy + d );
    qz = fr( qz + d );
    return fract( fr( fr( qx + qy ) * qz ) );
}

function latticeCoord( index: number, size: number ): number {
    return index < size / 2 ? index : index - size;
}

export function noiseVolumeData( size: number, seed: number ): Uint8Array {
    const data = new Uint8Array( size * size * size );
    const offset = seed * 1024;
    let cursor = 0;
    for ( let z = 0; z < size; z++ ) {
        const pz = latticeCoord( z, size ) + offset;
        for ( let y = 0; y < size; y++ ) {
            const py = latticeCoord( y, size );
            for ( let x = 0; x < size; x++ ) {
                data[ cursor++ ] = Math.min( 255, Math.round( hash31( latticeCoord( x, size ), py, pz ) * 255 ) );
            }
        }
    }
    return data;
}
