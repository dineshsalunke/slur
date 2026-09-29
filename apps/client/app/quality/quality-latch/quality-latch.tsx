import { type ReactNode, useCallback, useState } from 'react';
import type * as THREE from 'three';
import type { QualityFeature } from '../quality.constants';
import { qualityProfile } from '../quality.state';
import { registerQualityHook } from '../quality-sync/quality-sync.state';

export function QualityLatch( { feature, children }: { feature: QualityFeature; children: ReactNode } ) {
    const [ armed, setArmed ] = useState( () => qualityProfile()[ feature ] );
    const attach = useCallback(
        ( group: THREE.Group ) =>
            registerQualityHook( ( profile ) => {
                group.visible = profile[ feature ];
                if ( profile[ feature ] ) setArmed( true );
            } ),
        [ feature ],
    );
    return <group ref={ attach }>{ armed ? children : null }</group>;
}
