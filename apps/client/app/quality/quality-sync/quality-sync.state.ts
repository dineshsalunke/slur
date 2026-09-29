import type { QualityProfile } from '../quality.constants';
import { qualityProfile } from '../quality.state';

const hooks = new Set< ( profile: QualityProfile ) => void >();

let synced: QualityProfile | null = null;

export function registerQualityHook( apply: ( profile: QualityProfile ) => void ): () => void {
    const profile = qualityProfile();
    synced ??= profile;
    hooks.add( apply );
    apply( profile );
    return () => {
        hooks.delete( apply );
    };
}

export function syncQuality(): void {
    const profile = qualityProfile();
    if ( profile === synced ) return;
    synced = profile;
    for ( const apply of hooks ) apply( profile );
}
