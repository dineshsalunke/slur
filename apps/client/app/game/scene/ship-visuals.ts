import { DEFAULT_SHIP, type ShipId } from '@slur/shared';

// Client-only ship VISUALS, keyed by the SAME shipId the sim resolves tuning from. Each model is uniform-
// scaled so its box == its class AABB footprint (WYSIWYG — you die exactly when the visible hull touches).
// scale/lift are DERIVED from each model's measured native bbox (jq on the glTF POSITION accessors):
//   scale = classWidthU / nativeWidthX ,  lift = −nativeMinY · scale  (rests the hull bottom at y=0)
// (See the phase note for the measured table.) `facing` flips a nose-backward model; all five share the
// Quaternius +Z-forward convention today — verify per model at the feel-gate and flip [0, Math.PI, 0] if a
// nose points at the camera. The registry is the SINGLE place a new ship's visuals get added.
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
    imperial: { url: '/models/ships/imperial.gltf', scale: 0.323, lift: 0.423, facing: [ 0, 0, 0 ] }, // capped (feel-gate) → 2.5×6.0u, matches halfW 1.25 / halfL 3.0
};

// Resolve a (possibly stale/unknown) shipId to its visuals, falling back to the default (Fighter) ship.
export function shipVisual( shipId: string ): ShipVisual {
    return SHIP_VISUALS[ shipId as ShipId ] ?? SHIP_VISUALS[ DEFAULT_SHIP ];
}
