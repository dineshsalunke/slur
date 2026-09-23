let startedAt = performance.now();

export function testRunSeconds(): number {
    return ( performance.now() - startedAt ) / 1000;
}

export function restartRunClock(): void {
    startedAt = performance.now();
}
