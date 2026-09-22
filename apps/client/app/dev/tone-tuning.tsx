import { useFrame } from '@react-three/fiber';
import { BlendFunction, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { choice } from './tunables';

const MODES: Record< string, ToneMappingMode > = {
    Linear: ToneMappingMode.LINEAR,
    Reinhard: ToneMappingMode.REINHARD,
    Cineon: ToneMappingMode.CINEON,
    ACESFilmic: ToneMappingMode.ACES_FILMIC,
    AgX: ToneMappingMode.AGX,
    Neutral: ToneMappingMode.NEUTRAL,
};

export function ToneTuning() {
    const toneMapping = useMemo( () => new ToneMappingEffect( { mode: ToneMappingMode.AGX } ), [] );

    // JUSTIFIED EFFECT — syncs with an external system: the GPU resources the effect allocates outside React.
    useEffect( () => () => toneMapping.dispose(), [ toneMapping ] );

    useFrame( () => {
        const mode = MODES[ choice( 'tone.mapping' ) ];
        const blend = mode === undefined ? BlendFunction.SKIP : BlendFunction.SRC;
        if ( mode !== undefined ) toneMapping.mode = mode;
        if ( toneMapping.blendMode.blendFunction !== blend ) toneMapping.blendMode.blendFunction = blend;
    } );

    return <primitive object={ toneMapping } dispose={ null } />;
}
