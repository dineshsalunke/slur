const startedAt = performance.now();

export function testRunSeconds(): number {
    return ( performance.now() - startedAt ) / 1000;
}
