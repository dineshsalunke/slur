import type { PlayerInput, ShipId, TrackDescriptor } from '@slur/shared';

export interface LabResult {
    finished: boolean;
    frames: number;
    deaths: number;
}

export interface LabRun {
    shipId: ShipId;
    inputs: PlayerInput[];
    result: LabResult;
}

export interface LabVariant {
    id: string;
    rules: string[];
    score: string;
    track: TrackDescriptor;
    runs: LabRun[];
}

export interface LabBundle {
    name: string;
    song: string;
    variants: LabVariant[];
}
