import { tuningForShip } from '../ship-classes.js';

export interface ProjectileState {
    x: number;
    y: number;
    z: number;
    ownerId: string;
    ttl: number;
    dir: number;
}

export interface HitShip {
    id: string;
    x: number;
    y: number;
    z: number;
    halfW: number;
    halfL: number;
    dead: boolean;
    spectating: boolean;
}

export interface Racer {
    x: number;
    y: number;
    z: number;
    shipId: string;
    dead: boolean;
    spectating: boolean;
}

export function hitShipsOf( racers: Iterable< [ string, Racer ] > ): HitShip[] {
    const ships: HitShip[] = [];
    for ( const [ id, r ] of racers ) {
        if ( r.spectating ) continue;
        const t = tuningForShip( r.shipId );
        ships.push( { id, x: r.x, y: r.y, z: r.z, halfW: t.halfW, halfL: t.halfL, dead: r.dead, spectating: false } );
    }
    return ships;
}
