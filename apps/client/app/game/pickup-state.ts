const taken = new Set< string >();

export function isPickupTaken( id: string ): boolean {
    return taken.has( id );
}

export function markPickup( id: string, on: boolean ): void {
    if ( on ) taken.add( id );
    else taken.delete( id );
}

export function clearPickupState(): void {
    taken.clear();
}
