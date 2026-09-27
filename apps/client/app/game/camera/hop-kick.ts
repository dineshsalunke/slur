const HOP_FOV_DEG = 10;
const HOP_FOV_S = 0.3;

let kick = 0;

export function kickFov(): void {
    kick = 1;
}

export function hopFov( dt: number ): number {
    kick = Math.max( 0, kick - dt / HOP_FOV_S );
    return kick * kick * HOP_FOV_DEG;
}
