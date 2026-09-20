import { DEFAULT_SHIP, type ShipId } from '@slur/shared';

// Client-only ship VISUALS, keyed by the SAME shipId the sim resolves tuning from. Each model is uniform-
// scaled so its box equals its class AABB footprint — you die exactly when the visible hull touches.
// scale/lift are DERIVED from the measured native bbox: scale = classWidthU / nativeWidthX, lift = −minY · scale.
// `facing` flips a nose-backward model: the Quaternius placeholders are +Z-forward, split-crown is −Z.
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
    // Authored to the footprint: bbox 2.5000 × 1.0025 × 6.0000, minY 0; Engine_core at z ≈ +2.995 ⇒ stern is +Z.
    'split-crown': { url: '/models/ships/split-crown.glb', scale: 1, lift: 0, facing: [ 0, Math.PI, 0 ] },
};

// Resolve a (possibly stale/unknown) shipId to its visuals, falling back to the default (Fighter) ship.
export function shipVisual( shipId: string ): ShipVisual {
    return SHIP_VISUALS[ shipId as ShipId ] ?? SHIP_VISUALS[ DEFAULT_SHIP ];
}
