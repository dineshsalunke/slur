import { tuningVersion } from '../../../dev/tuning';

const targets = new Set< () => void >();

let synced = tuningVersion();

export function registerDialSync( apply: () => void ): () => void {
    targets.add( apply );
    apply();
    return () => {
        targets.delete( apply );
    };
}

export function syncDials(): void {
    const version = tuningVersion();
    if ( version === synced ) return;
    synced = version;
    for ( const apply of targets ) apply();
}
