export function typingTarget( target: EventTarget | null ): boolean {
    const el = target as HTMLElement | null;
    if ( ! el ) return false;
    return el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
}
