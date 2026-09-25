import { createRequire } from 'node:module';
import { COLOR_TUNABLES, NUMBER_TUNABLES } from '../../../../apps/client/app/dev/tuning-schema.ts';

const { chromium } = await import( process.env.PW ?? createRequire( import.meta.url ).resolve( 'playwright-core' ) );

const [ , , out = 'shot', hold = '0', w = '1600', h = '900' ] = process.argv;
const url = process.env.URL ?? 'http://localhost:5173/test-level';
const tune = JSON.parse( process.env.TUNE ?? '{}' );
const stored = {};
for ( const [ path, value ] of Object.entries( tune ) ) {
    const spec = NUMBER_TUNABLES[ path ] ?? COLOR_TUNABLES[ path ];
    if ( ! spec ) throw new Error( `unknown tunable ${ path }` );
    stored[ path ] = { value, from: spec.value };
}
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
const page = await browser.newPage( {
    viewport: { width: +w, height: +h },
    deviceScaleFactor: +( process.env.DPR ?? 1 ),
} );
await page.addInitScript( ( json ) => localStorage.setItem( 'slur.tuning.v1', json ), JSON.stringify( stored ) );
const logs = [];
page.on( 'console', ( m ) => {
    if ( m.type() === 'error' || m.type() === 'warning' ) logs.push( `${ m.type() }: ${ m.text() }` );
} );
page.on( 'pageerror', ( e ) => logs.push( `pageerror: ${ e.message }` ) );
await page.goto( url, { waitUntil: 'networkidle' } );
await page.waitForTimeout( +( process.env.WAIT ?? 5000 ) );
await page.addStyleTag( {
    content:
        '#leva__root, body > div[class^="leva-c-"], body > div > div[class*="leva-c-"][style*="fixed"]{display:none!important}',
} );
await page.mouse.click( +w / 2, +h / 2 );
if ( +hold > 0 ) {
    await page.keyboard.down( 'KeyW' );
    await page.waitForTimeout( +hold );
}
const fps = await page.evaluate(
    () =>
        new Promise( ( r ) => {
            let n = 0;
            const t0 = performance.now();
            const f = () => {
                n++;
                if ( performance.now() - t0 < 3000 ) requestAnimationFrame( f );
                else r( n / ( ( performance.now() - t0 ) / 1000 ) );
            };
            requestAnimationFrame( f );
        } ),
);
await page.screenshot( { path: `${ process.env.S }/${ out }.png` } );
if ( +hold > 0 ) await page.keyboard.up( 'KeyW' );
console.log( JSON.stringify( { fps: Math.round( fps ), logs: logs.slice( 0, 15 ) } ) );
await browser.close();
