export function synthKey( code: string ): void {
    document.body.dispatchEvent( new KeyboardEvent( 'keydown', { code, bubbles: true } ) );
    document.body.dispatchEvent( new KeyboardEvent( 'keyup', { code, bubbles: true } ) );
}
