export function airRuns( air: Uint8Array ): Array< [ number, number ] > {
    const out: Array< [ number, number ] > = [];
    let k = 0;
    while ( k < air.length ) {
        if ( air[ k ] === 0 ) {
            k++;
            continue;
        }
        let end = k;
        while ( end < air.length && air[ end ] === 1 ) end++;
        out.push( [ Math.max( 0, k - 1 ), Math.min( air.length, end + 1 ) ] );
        k = end;
    }
    return out;
}
