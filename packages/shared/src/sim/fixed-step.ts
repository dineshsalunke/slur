// Fixed-timestep accumulator. Feed it real elapsed render time; it calls `step(dt)` a whole number
// of times at a fixed dt and returns the interpolation `alpha` (0..1) for lerping prev→curr.
// Shared with the S2 server so client and server tick identically.

export type StepFn = ( dt: number ) => void;

export function createFixedStep( dt: number, maxSteps = 5 ): ( elapsedSeconds: number, step: StepFn ) => number {
    let acc = 0;
    return function advance( elapsedSeconds: number, step: StepFn ): number {
        acc += elapsedSeconds;
        let n = 0;
        while ( acc >= dt && n < maxSteps ) {
            step( dt );
            acc -= dt;
            n++;
        }
        if ( n === maxSteps ) acc = 0; // spiral-of-death guard: drop the backlog
        return acc / dt;
    };
}
