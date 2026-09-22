import { Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { hdriUrl, useHdriSlug } from '../../dev/env-store';
import { HdriBoundary } from './hdri-boundary';

export function HdriEnvironment() {
    const slug = useHdriSlug();

    if ( ! slug ) return null;

    return (
        <HdriBoundary key={ slug }>
            <Suspense fallback={ null }>
                <Environment files={ hdriUrl( slug ) } background={ false } />
            </Suspense>
        </HdriBoundary>
    );
}
