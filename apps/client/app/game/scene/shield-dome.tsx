import { useFrame } from '@react-three/fiber';
import { tuningForShip } from '@slur/shared';
import type { Entity } from 'koota';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Shield } from '../ecs/traits';
import {
    SHIELD_DOME_HEIGHT,
    SHIELD_DOME_MARGIN,
    SHIELD_DOME_SHADER,
    SHIELD_DOME_SINK,
    shieldAlpha,
    shieldDomeGeometry,
    shieldDomeUniforms,
    shieldGrow,
} from './shield-look';

const DOME = shieldDomeGeometry();

export function ShieldDome( { entity, shipId, windowS }: { entity: Entity; shipId: string; windowS: number } ) {
    const mesh = useRef< THREE.Mesh | null >( null );
    const uniforms = useMemo( shieldDomeUniforms, [] );
    const tuning = tuningForShip( shipId );
    const rx = tuning.halfW + SHIELD_DOME_MARGIN;
    const rz = tuning.halfL + SHIELD_DOME_MARGIN;

    useFrame( () => {
        const m = mesh.current;
        const s = entity.get( Shield );
        if ( ! m || ! s ) return;
        const now = performance.now() / 1000;
        const popAge = s.popAt < 0 ? -1 : now - s.popAt;
        const alpha = shieldAlpha( s.on, now - s.since, windowS, popAge );
        m.visible = alpha > 0;
        if ( ! m.visible ) return;
        uniforms.uAlpha.value = alpha;
        const grow = shieldGrow( popAge );
        m.scale.set( rx * grow, SHIELD_DOME_HEIGHT * grow, rz * grow );
    } );

    return (
        <mesh
            ref={ mesh }
            geometry={ DOME }
            position={ [ 0, -SHIELD_DOME_SINK, 0 ] }
            scale={ [ rx, SHIELD_DOME_HEIGHT, rz ] }
            visible={ false }
            renderOrder={ 2 }
        >
            <shaderMaterial
                args={ [
                    {
                        ...SHIELD_DOME_SHADER,
                        uniforms,
                        transparent: true,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                    },
                ] }
            />
        </mesh>
    );
}
