import { type Bus, loadSample, type PlayOpts, play } from './audio-engine';
import { startLoop, stopLoop } from './loop-voice';

const BASE = '/audio/sfx';

export type Sfx =
    | 'boltA'
    | 'boltB'
    | 'boltC'
    | 'hit'
    | 'stun'
    | 'pickup'
    | 'threat'
    | 'death'
    | 'respawn'
    | 'boost'
    | 'brake'
    | 'jump'
    | 'land'
    | 'passBy'
    | 'seekerFire'
    | 'seekerLocking'
    | 'seekerLocked'
    | 'seekerHit'
    | 'mineBurst'
    | 'mineFizzle'
    | 'shieldPop'
    | 'portalHop'
    | 'portalFizzle'
    | 'countdown'
    | 'go'
    | 'uiNav'
    | 'uiSelect'
    | 'uiConfirm'
    | 'uiError';

interface SfxDef {
    file: string;
    bus: Bus;
    gain?: number;
    rate?: number;
    cut?: boolean;
}

const TABLE: Record< Sfx, SfxDef > = {
    boltA: { file: 'bolt_a.ogg', bus: 'combat', gain: 0.7 },
    boltB: { file: 'bolt_b.ogg', bus: 'combat', gain: 0.7 },
    boltC: { file: 'bolt_c.ogg', bus: 'combat', gain: 0.7 },
    hit: { file: 'hit_ship.ogg', bus: 'combat', gain: 0.9 },
    stun: { file: 'stun.ogg', bus: 'combat', gain: 0.85 },
    pickup: { file: 'pickup.ogg', bus: 'ui', gain: 0.8, cut: true },
    threat: { file: 'threat.ogg', bus: 'threat', gain: 0.9 },
    death: { file: 'death_derezz.ogg', bus: 'combat', gain: 1 },
    respawn: { file: 'respawn.ogg', bus: 'combat', gain: 0.8 },
    boost: { file: 'boost_thrust.ogg', bus: 'combat', gain: 0.8 },
    brake: { file: 'brake.ogg', bus: 'engine', gain: 0.8, cut: true },
    jump: { file: 'jump.ogg', bus: 'engine', gain: 0.9 },
    land: { file: 'land.ogg', bus: 'engine', gain: 0.9 },
    passBy: { file: 'pass_by.ogg', bus: 'engine', gain: 0.6 },
    seekerFire: { file: 'seeker_fire.ogg', bus: 'combat', gain: 0.85 },
    seekerLocking: { file: 'seeker_locking.ogg', bus: 'threat', gain: 0.5 },
    seekerLocked: { file: 'seeker_locked.ogg', bus: 'threat', gain: 0.8 },
    seekerHit: { file: 'seeker_hit.ogg', bus: 'combat', gain: 0.9 },
    mineBurst: { file: 'mine_burst.ogg', bus: 'combat', gain: 0.85 },
    mineFizzle: { file: 'death_derezz.ogg', bus: 'combat', gain: 0.55, rate: 1.8 },
    shieldPop: { file: 'hit_ship.ogg', bus: 'combat', gain: 0.9, rate: 1.5 },
    portalHop: { file: 'respawn.ogg', bus: 'combat', gain: 0.8, rate: 1.6 },
    portalFizzle: { file: 'death_derezz.ogg', bus: 'combat', gain: 0.45, rate: 2.2 },
    countdown: { file: 'countdown_blip.ogg', bus: 'ui', gain: 0.9 },
    go: { file: 'go.ogg', bus: 'ui', gain: 1 },
    uiNav: { file: 'ui_nav.ogg', bus: 'ui', gain: 0.5 },
    uiSelect: { file: 'ui_select.ogg', bus: 'ui', gain: 0.6 },
    uiConfirm: { file: 'ui_confirm.ogg', bus: 'ui', gain: 0.7 },
    uiError: { file: 'ui_error.ogg', bus: 'ui', gain: 0.7 },
};

const BOLTS: Sfx[] = [ 'boltA', 'boltB', 'boltC' ];
let boltCursor = 0;

export const ENGINE_LOOP = { name: 'engineLoop', file: `${ BASE }/hover_engine.ogg` } as const;

export const MUSIC = {
    run: { name: 'music.run', file: '/audio/music/vector_racing.ogg' },
    lobby: { name: 'music.lobby', file: '/audio/music/lobby_calm_ambient.mp3' },
} as const;

export async function preloadAudio(): Promise< void > {
    const jobs: Promise< void >[] = [];
    for ( const key of Object.keys( TABLE ) as Sfx[] ) {
        jobs.push( loadSfx( key ) );
    }
    jobs.push( loadSample( ENGINE_LOOP.name, ENGINE_LOOP.file ) );
    jobs.push( loadSample( MUSIC.run.name, MUSIC.run.file ) );
    jobs.push( loadSample( MUSIC.lobby.name, MUSIC.lobby.file ) );
    await Promise.all( jobs );
}

export function playSfx( sfx: Sfx, over: PlayOpts = {} ): void {
    const def = TABLE[ sfx ];
    play( sfx, { bus: def.bus, gain: def.gain, rate: def.rate, cut: def.cut, ...over } );
}

export function playBolt(): void {
    playSfx( BOLTS[ boltCursor ] );
    boltCursor = ( boltCursor + 1 ) % BOLTS.length;
}

export function startSfxLoop( key: string, sfx: Sfx ): void {
    const def = TABLE[ sfx ];
    startLoop( key, sfx, def.bus, def.gain ?? 1 );
}

export { stopLoop as stopSfxLoop };

export function loadSfx( sfx: Sfx ): Promise< void > {
    return loadSample( sfx, `${ BASE }/${ TABLE[ sfx ].file }` );
}
