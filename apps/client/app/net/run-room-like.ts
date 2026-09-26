import type { Decoder } from '@colyseus/schema';
import type { RunState } from '@slur/shared';

export interface RunRoomLike {
    readonly roomId: string;
    readonly sessionId: string;
    readonly state: RunState;
    readonly serializer: { readonly decoder: Decoder< RunState > };
    send( type: string, payload?: unknown ): void;
    onMessage< Payload >( type: string, callback: ( payload: Payload ) => void ): () => void;
}
