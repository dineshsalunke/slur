import type { TrackDescriptor } from '@slur/shared';
import { FpsReadout } from '../../../dev/fps-readout';
import { FrameTap } from '../../../dev/frame-tap';
import { NetCanvas } from '../../../game/net-canvas';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { RoomProvider } from '../../../net/room-context/room-context';
import { TestLevelDev } from '../test-level-dev/test-level-dev';

export function TestLevelCanvas( { room, descriptor }: { room: LoopbackRoom; descriptor: TrackDescriptor } ) {
    return (
        <RoomProvider room={ room }>
            <NetCanvas descriptor={ descriptor }>
                <TestLevelDev room={ room } />
                <FrameTap />
            </NetCanvas>
            <div className="pointer-events-none fixed inset-x-0 bottom-[clamp(16px,4.4vh,46px)] z-20 flex justify-center font-readout text-readout uppercase select-none">
                <FpsReadout />
            </div>
        </RoomProvider>
    );
}
