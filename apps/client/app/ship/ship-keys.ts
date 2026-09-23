const KEY_DIR: Record< string, -1 | 1 > = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };

function typing( target: EventTarget | null ): boolean {
    return (
        target instanceof HTMLElement &&
        ( target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) )
    );
}

export function stepOf( e: KeyboardEvent ): -1 | 1 | 0 {
    const dir = KEY_DIR[ e.code ];
    if ( ! dir || e.repeat || e.altKey || e.ctrlKey || e.metaKey || typing( e.target ) ) return 0;
    return dir;
}

export function isBareEnter( e: KeyboardEvent ): boolean {
    return e.code === 'Enter' && e.target === document.body;
}
