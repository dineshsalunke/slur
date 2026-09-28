export function stickVector( dx: number, dy: number, radius: number ): { x: number; y: number } {
    const scale = Math.max( radius, Math.hypot( dx, dy ) );
    return { x: dx / scale, y: dy / scale };
}
