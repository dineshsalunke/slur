import { DEFAULT_SHIP, type ShipId } from '@slur/shared';

export interface ShipVisual {
    url: string;
    scale: number;
    lift: number;
    facing: [ number, number, number ];
}

export const SHIP_VISUALS: Record< ShipId, ShipVisual > = {
    executioner: { url: '/models/ships/executioner.gltf', scale: 0.1996, lift: 0.154, facing: [ 0, 0, 0 ] },
    challenger: { url: '/models/ships/challenger.gltf', scale: 0.2476, lift: 0.203, facing: [ 0, 0, 0 ] },
    bob: { url: '/models/ships/bob.gltf', scale: 0.2095, lift: 0.182, facing: [ 0, 0, 0 ] },
    dispatcher: { url: '/models/ships/dispatcher.gltf', scale: 0.4898, lift: 0.696, facing: [ 0, 0, 0 ] },
    'split-crown': { url: '/models/ships/split-crown.glb', scale: 1, lift: 0, facing: [ 0, Math.PI, 0 ] },
};

export function shipVisual( shipId: string ): ShipVisual {
    return SHIP_VISUALS[ shipId as ShipId ] ?? SHIP_VISUALS[ DEFAULT_SHIP ];
}
