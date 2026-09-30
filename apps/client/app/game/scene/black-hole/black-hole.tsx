import { useTexture } from '@react-three/drei';
import { Fragment, useCallback, useMemo } from 'react';
import type * as THREE from 'three';
import { useQuality } from '../../../quality/use-quality';
import { FrameSchedule } from '../../frame/frame-schedule/frame-schedule';
import { useTrack } from '../../track-context/use-track';
import { prefersReducedMotion } from '../reduced-motion';
import { BACKDROP_URL } from '../scene-backdrop/scene-backdrop.constants';
import { createBlackHole, disposeBlackHole } from './black-hole.state';
import { tierPlan } from './black-hole.utils';
import { BLACK_HOLE_SCHEDULE, FACE_BACK, PLANE_ARGS } from './black-hole-schedule.constants';

export function BlackHole() {
    const finishZ = useTrack().finishZ;
    const tier = useQuality().tier;
    const backdrop = useTexture( BACKDROP_URL );
    const hole = useMemo(
        () => createBlackHole( tierPlan( tier, prefersReducedMotion() ), finishZ, backdrop ),
        [ tier, finishZ, backdrop ],
    );
    const attach = useCallback(
        ( mesh: THREE.Mesh | null ) => {
            hole.mesh = mesh;
            return () => {
                hole.mesh = null;
                disposeBlackHole( hole );
            };
        },
        [ hole ],
    );

    return (
        <Fragment>
            <mesh ref={ attach } material={ hole.material } rotation={ FACE_BACK } visible={ false }>
                <planeGeometry args={ PLANE_ARGS } />
            </mesh>
            <FrameSchedule schedule={ BLACK_HOLE_SCHEDULE } context={ hole } />
        </Fragment>
    );
}
