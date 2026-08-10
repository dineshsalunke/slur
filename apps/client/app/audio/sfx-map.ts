import { type Bus, loadSample, type PlayOpts, play } from './audio-engine';

// ── Event → sound table. ─────────────────────────────────────────────────────────────────────────────────
// Every gameplay cue maps to ONE logical name here; the name resolves to a file under /audio/sfx/ and a
// default mix (bus/gain/rate). game-audio + bind-room-audio call playSfx(<Sfx>) — they never touch file
// paths. All samples are CC0 (Kenney packs); music is separate (audio-engine.playMusic). Missing file →
// silent no-op (audio-engine), so a partial download never breaks the game.

const BASE = '/audio/sfx';

// The public event vocabulary (AUDIO.md §4). Add a cue → add a row in TABLE below.
export type Sfx =
    | 'fire' // bolt launch (your own)
    | 'hit' // a ship takes an impact
    | 'stun' // YOU get disrupted (descending spin whine)
    | 'pickup' // power-up collected (bright confirm)
    | 'threat' // incoming hostile bolt telegraph (LCARS blip)
    | 'death' // derezz / elimination
    | 'respawn' // materialize back in
    | 'boost' // boost whoosh (wired when the boost pickup lands — fast-follow)
    | 'countdown' // 3-2-1 blip (pitch rises via rate)
    | 'go' // GO downbeat
    | 'uiNav' // menu move / hover
    | 'uiSelect' // menu click
    | 'uiConfirm' // commit (lock ship, host start)
    | 'uiError'; // rejected action

interface SfxDef {
    file: string;
    bus: Bus;
    gain?: number;
    rate?: number;
}

// file = basename under /audio/sfx (.ogg). bus places it in the duck order; gain/rate are the resting mix.
const TABLE: Record< Sfx, SfxDef > = {
    fire: { file: 'laser_fire.ogg', bus: 'combat', gain: 0.7 },
    hit: { file: 'hit_impact.ogg', bus: 'combat', gain: 0.9 },
    stun: { file: 'stun.ogg', bus: 'combat', gain: 0.85 },
    pickup: { file: 'pickup.ogg', bus: 'ui', gain: 0.8 },
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

// Music tracks (looping beds). Loaded alongside SFX; audio-engine.playMusic(<key>) selects one by name.
export const MUSIC = {
    run: { name: 'music.run', file: '/audio/music/neon_laser_horizon.mp3' }, // in-run bed (CC-BY — see CREDITS.md)
    lobby: { name: 'music.lobby', file: '/audio/music/lobby_calm_ambient.mp3' }, // lobby idle (CC0)
} as const;

// Fetch + decode every SFX and both music beds (idempotent). Call once when the game scene mounts.
export async function preloadAudio(): Promise< void > {
    const jobs: Promise< void >[] = [];
    for ( const key of Object.keys( TABLE ) as Sfx[] ) {
        jobs.push( loadSample( key, `${ BASE }/${ TABLE[ key ].file }` ) );
    }
    jobs.push( loadSample( MUSIC.run.name, MUSIC.run.file ) );
    jobs.push( loadSample( MUSIC.lobby.name, MUSIC.lobby.file ) );
    await Promise.all( jobs );
}

// Play a cue by its event name. `over` overrides the resting mix (e.g. a pitched countdown blip via rate).
export function playSfx( sfx: Sfx, over: PlayOpts = {} ): void {
    const def = TABLE[ sfx ];
    play( sfx, { bus: def.bus, gain: def.gain, rate: def.rate, ...over } );
}
