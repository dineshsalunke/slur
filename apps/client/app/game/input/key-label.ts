const NAMED: Readonly< Record< string, string > > = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Space: 'Space',
};

export function keyLabel( code: string ): string {
    return NAMED[ code ] ?? code.replace( /^Key/, '' );
}
