export function fromUser( target: EventTarget | null ): boolean {
    return target !== null && document.activeElement === target;
}
