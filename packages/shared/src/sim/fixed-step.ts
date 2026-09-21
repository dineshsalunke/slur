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
        if ( n === maxSteps ) acc = 0;
        return acc / dt;
    };
}
