import type { Decoder } from '@colyseus/schema';
import type { RunCommandInputs, RunCommandType, RunEvent, RunState, SimConfig } from '@slur/shared';

export interface RunRoomLike {
    readonly roomId: string;
    readonly sessionId: string;
    readonly state: RunState;
    readonly serializer: { readonly decoder: Decoder< RunState > };
    readonly simConfig?: SimConfig;
    send< K extends RunCommandType >( type: K, payload: RunCommandInputs[ K ] ): void;
    send( type: string, payload?: unknown ): void;
    onMessage< Payload >( type: RunEvent< Payload >, callback: ( payload: Payload ) => void ): () => void;
    onMessage< Payload >( type: string, callback: ( payload: Payload ) => void ): () => void;
    hostTick?( seconds: number ): void;
}
