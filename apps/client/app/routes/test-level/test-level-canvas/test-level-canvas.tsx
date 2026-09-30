import type { TrackDescriptor } from '@slur/shared';
import { Suspense } from 'react';
import { FpsReadout } from '../../../dev/fps-readout';
import { FrameTap } from '../../../dev/frame-tap';
import { NetCanvas } from '../../../game/net-canvas';
import { BlackHole } from '../../../game/scene/black-hole/black-hole';
import type { BlackHolePlacement } from '../../../game/scene/black-hole/black-hole.utils';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { RoomProvider } from '../../../net/room-context/room-context';
import { TestLevelDev } from '../test-level-dev/test-level-dev';
import { PauseWhileEditing } from './pause-while-editing/pause-while-editing';

export function TestLevelCanvas( {
    room,
    descriptor,
    blackHole,
}: {
    room: LoopbackRoom;
    descriptor: TrackDescriptor;
    blackHole: BlackHolePlacement | null;
} ) {
    return (
        <RoomProvider room={ room }>
            <NetCanvas descriptor={ descriptor }>
                <TestLevelDev room={ room } />
                <FrameTap />
                <PauseWhileEditing />
                { blackHole && (
                    <Suspense fallback={ null }>
                        <BlackHole />
                    </Suspense>
                ) }
            </NetCanvas>
            <div className="pointer-events-none fixed inset-x-0 bottom-[clamp(16px,4.4vh,46px)] z-20 flex justify-center font-readout text-readout uppercase select-none">
                <FpsReadout />
            </div>
        </RoomProvider>
    );
}
