import type { ShipId } from '@slur/shared';

export interface ExhaustPort {
    x: number;
    y: number;
    z: number;
}

export const PORT_WIDTH = 0.34;
export const PORT_HEIGHT = 0.131;

const SPLIT_CROWN: ExhaustPort[] = [
    { x: -0.31, y: 0.245, z: -2.99 },
    { x: 0.31, y: 0.245, z: -2.99 },
    { x: -0.31, y: 0.605, z: -2.99 },
    { x: 0.31, y: 0.605, z: -2.99 },
];

const PORTS: Partial< Record< ShipId, ExhaustPort[] > > = {
    'split-crown': SPLIT_CROWN,
};

export const MAX_PORTS_PER_SHIP = 4;

export function exhaustPorts( shipId: string ): ExhaustPort[] | undefined {
    return PORTS[ shipId as ShipId ];
}
