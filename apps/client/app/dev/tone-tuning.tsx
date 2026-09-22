import { useFrame } from '@react-three/fiber';
import { BlendFunction, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { Fragment, useEffect, useMemo } from 'react';
import { ExposureEffect } from './exposure-effect';
import { choice, num } from './tunables';

const MODES: Record< string, ToneMappingMode > = {
    Linear: ToneMappingMode.LINEAR,
    Reinhard: ToneMappingMode.REINHARD,
    Cineon: ToneMappingMode.CINEON,
    ACESFilmic: ToneMappingMode.ACES_FILMIC,
    AgX: ToneMappingMode.AGX,
    Neutral: ToneMappingMode.NEUTRAL,
};

export function ToneTuning() {
    const exposure = useMemo( () => new ExposureEffect(), [] );
    const toneMapping = useMemo( () => new ToneMappingEffect( { mode: ToneMappingMode.AGX } ), [] );

    // JUSTIFIED EFFECT — syncs with an external system: the GPU resources both effects allocate outside React.
    useEffect(
        () => () => {
            exposure.dispose();
            toneMapping.dispose();
        },
        [ exposure, toneMapping ],
    );

    useFrame( () => {
        exposure.exposure = num( 'tone.exposure' );
        const mode = MODES[ choice( 'tone.mapping' ) ];
        const blend = mode === undefined ? BlendFunction.SKIP : BlendFunction.SRC;
        if ( mode !== undefined ) toneMapping.mode = mode;
        if ( toneMapping.blendMode.blendFunction !== blend ) toneMapping.blendMode.blendFunction = blend;
    } );

    return (
        <Fragment>
            <primitive object={ exposure } dispose={ null } />
            <primitive object={ toneMapping } dispose={ null } />
        </Fragment>
    );
}
