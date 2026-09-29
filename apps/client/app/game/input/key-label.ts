const NAMED: Readonly< Record< string, string > > = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Space: 'Space',
};

const MODIFIERS: Readonly< Record< string, string > > = {
    Shift: 'Shift',
    Control: 'Ctrl',
    Alt: 'Alt',
    Meta: 'Cmd',
};

export function keyLabel( code: string ): string {
    const named = NAMED[ code ];
    if ( named ) return named;
    const sided = /^(Shift|Control|Alt|Meta)(Left|Right)$/.exec( code );
    if ( sided ) return `${ sided[ 2 ] === 'Left' ? 'L' : 'R' } ${ MODIFIERS[ sided[ 1 ] ] }`;
    return code.replace( /^(Key|Digit)/, '' );
}

export function macKeyboard(): boolean {
    return /Mac/.test( navigator.userAgent );
}
