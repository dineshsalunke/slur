export interface ShieldHolder {
    shielded: boolean;
    shieldTimer: number;
}

export function raiseShield( s: ShieldHolder, seconds: number ): void {
    s.shielded = seconds > 0;
    s.shieldTimer = Math.max( 0, seconds );
}

export function dropShield( s: ShieldHolder ): void {
    s.shielded = false;
    s.shieldTimer = 0;
}

export function stepShield( s: ShieldHolder, dt: number ): void {
    if ( ! s.shielded ) return;
    s.shieldTimer -= dt;
    if ( s.shieldTimer <= 0 ) dropShield( s );
}

export function absorbHit( s: ShieldHolder ): boolean {
    if ( ! s.shielded ) return false;
    dropShield( s );
    return true;
}
