import { type Bus, loadSample, type PlayOpts, play } from './audio-engine';

const BASE = '/audio/sfx';

export type Sfx =
    | 'fire'
    | 'hit'
    | 'stun'
    | 'pickup'
    | 'threat'
    | 'death'
    | 'respawn'
    | 'boost'
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
    fire: { file: 'laser_fire.ogg', bus: 'combat', gain: 0.7 },
    hit: { file: 'hit_impact.ogg', bus: 'combat', gain: 0.9 },
    stun: { file: 'stun.ogg', bus: 'combat', gain: 0.85 },
    pickup: { file: 'pickup.ogg', bus: 'ui', gain: 0.8, cut: true },
    threat: { file: 'threat.ogg', bus: 'threat', gain: 0.9 },
    death: { file: 'death_derezz.ogg', bus: 'combat', gain: 1 },
    respawn: { file: 'respawn.ogg', bus: 'combat', gain: 0.8 },
    boost: { file: 'boost.ogg', bus: 'combat', gain: 0.7 },
    countdown: { file: 'countdown_blip.ogg', bus: 'ui', gain: 0.9 },
    go: { file: 'go.ogg', bus: 'ui', gain: 1 },
    uiNav: { file: 'ui_nav.ogg', bus: 'ui', gain: 0.5 },
    uiSelect: { file: 'ui_select.ogg', bus: 'ui', gain: 0.6 },
    uiConfirm: { file: 'ui_confirm.ogg', bus: 'ui', gain: 0.7 },
    uiError: { file: 'ui_error.ogg', bus: 'ui', gain: 0.7 },
};

export const MUSIC = {
    run: { name: 'music.run', file: '/audio/music/neon_laser_horizon.mp3' },
    lobby: { name: 'music.lobby', file: '/audio/music/lobby_calm_ambient.mp3' },
} as const;

export async function preloadAudio(): Promise< void > {
    const jobs: Promise< void >[] = [];
    for ( const key of Object.keys( TABLE ) as Sfx[] ) {
        jobs.push( loadSfx( key ) );
    }
    jobs.push( loadSample( MUSIC.run.name, MUSIC.run.file ) );
    jobs.push( loadSample( MUSIC.lobby.name, MUSIC.lobby.file ) );
    await Promise.all( jobs );
}

export function playSfx( sfx: Sfx, over: PlayOpts = {} ): void {
    const def = TABLE[ sfx ];
    play( sfx, { bus: def.bus, gain: def.gain, rate: def.rate, cut: def.cut, ...over } );
}

export function loadSfx( sfx: Sfx ): Promise< void > {
    return loadSample( sfx, `${ BASE }/${ TABLE[ sfx ].file }` );
}
