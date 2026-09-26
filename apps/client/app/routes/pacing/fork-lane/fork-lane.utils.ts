export function placeAt( seconds: number ): ( el: HTMLElement | null ) => void {
    return ( el ) => el?.style.setProperty( '--at', String( seconds ) );
}
