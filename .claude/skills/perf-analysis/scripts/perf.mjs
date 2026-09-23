import { createRequire } from 'node:module';

const { chromium } = await import( process.env.PW ?? createRequire( import.meta.url ).resolve( 'playwright-core' ) );

const w = +( process.env.W ?? 1728 );
const h = +( process.env.H ?? 1080 );
const dpr = +( process.env.DPR ?? 2 );
const reps = +( process.env.REPS ?? 3 );
const url = process.env.URL ?? 'http://localhost:5173/test-level';
const browser = await chromium.launch( {
    headless: true,
    executablePath: process.env.E,
    args: [
        '--use-angle=metal',
        '--enable-gpu',
        '--ignore-gpu-blocklist',
        '--enable-unsafe-swiftshader',
        '--disable-gpu-vsync',
        '--disable-frame-rate-limit',
    ],
} );
const page = await browser.newPage( { viewport: { width: w, height: h }, deviceScaleFactor: dpr } );
await page.addInitScript( ( json ) => localStorage.setItem( 'slur.tuning.v1', json ), process.env.STORE ?? '{}' );
page.on( 'pageerror', ( e ) => console.log( 'pageerror', e.message ) );

async function fresh() {
    await page.goto( url, { waitUntil: 'networkidle' } );
    await page.waitForTimeout( 3500 );
    await page.mouse.click( w / 2, h / 2 );
    await page.keyboard.down( 'KeyW' );
    await page.waitForTimeout( 1500 );
}

const measure = () =>
    page.evaluate(
        () =>
            new Promise( ( r ) => {
                const gl = globalThis.__slurStore().gl.getContext();
                const px = new Uint8Array( 4 );
                const deltas = [];
                let prev = performance.now();
                const t0 = prev;
                const f = () => {
                    gl.readPixels( 0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px );
                    const now = performance.now();
                    deltas.push( now - prev );
                    prev = now;
                    if ( now - t0 < 3000 ) requestAnimationFrame( f );
                    else {
                        deltas.sort( ( a, b ) => a - b );
                        r( deltas[ Math.floor( deltas.length / 2 ) ] );
                    }
                };
                requestAnimationFrame( f );
            } ),
    );

const toggles = {
    baseline: () => {},
    rails: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.isRectAreaLight ) o.visible = false;
        } ),
    backfill: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.isDirectionalLight ) o.visible = false;
        } ),
    points: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.isPointLight ) o.visible = false;
        } ),
    pointlights: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.isPointLight || o.isDirectionalLight ) o.visible = false;
        } ),
    sky: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.renderOrder === -1000 ) o.visible = false;
        } ),
    stars: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.isPoints ) o.visible = false;
        } ),
    rocks: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.material?.customProgramCacheKey?.() === 'slur-rock' ) o.visible = false;
        } ),
    deck: ( s ) =>
        s.scene.traverse( ( o ) => {
            if (
                o.isMesh &&
                o.material?.type === 'MeshStandardMaterial' &&
                o.material.customProgramCacheKey?.() !== 'slur-rock'
            )
                o.visible = false;
        } ),
    allmesh: ( s ) =>
        s.scene.traverse( ( o ) => {
            if ( o.isMesh || o.isPoints ) o.visible = false;
        } ),
};
const want = ( process.env.T ?? 'baseline' ).split( ',' );
const results = {};
await fresh();
await measure();
await fresh();
console.log( `warm baseline ${ ( await measure() ).toFixed( 2 ) }ms` );
for ( let rep = 0; rep < reps; rep++ ) {
    for ( const name of want ) {
        await fresh();
        await page.evaluate( `(${ toggles[ name ].toString() })(globalThis.__slurStore())` );
        await page.waitForTimeout( 700 );
        const ms = await measure();
        results[ name ] = Math.min( results[ name ] ?? Infinity, ms );
    }
}
const line = Object.entries( results )
    .map( ( [ k, v ] ) => `${ k }=${ v.toFixed( 2 ) }ms(${ Math.round( 1000 / v ) }fps)` )
    .join( '  ' );
console.log( line );
await browser.close();
