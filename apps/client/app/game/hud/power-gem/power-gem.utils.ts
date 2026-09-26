export function starPoints( spikes: number, outer: number, inner: number ): string {
    const pts: string[] = [];
    for ( let i = 0; i < spikes * 2; i++ ) {
        const r = i % 2 === 0 ? outer : inner;
        const a = ( i / ( spikes * 2 ) ) * Math.PI * 2 - Math.PI / 2;
        pts.push( `${ ( 24 + r * Math.cos( a ) ).toFixed( 2 ) },${ ( 24 + r * Math.sin( a ) ).toFixed( 2 ) }` );
    }
    return pts.join( ' ' );
}
