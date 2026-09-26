import { getDecoderStateCallbacks, type SchemaCallbackProxy } from '@colyseus/schema';
import type { RunState } from '@slur/shared';
import type { RunRoomLike } from './run-room-like';

export function stateCallbacks( room: RunRoomLike ): SchemaCallbackProxy< RunState > {
    return getDecoderStateCallbacks( room.serializer.decoder );
}
