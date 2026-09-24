export function synthKey( code: string ): void {
    dispatchEvent( new KeyboardEvent( 'keydown', { code, bubbles: true } ) );
    dispatchEvent( new KeyboardEvent( 'keyup', { code, bubbles: true } ) );
}
