export interface NumberSpec {
    group: string;
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    rebuild?: boolean;
}

export interface ColorSpec {
    group: string;
    label: string;
    value: string;
    rebuild?: boolean;
}

export interface ChoiceSpec {
    group: string;
    label: string;
    value: string;
    options: readonly string[];
}

export const TONE_MAPPINGS = [ 'None', 'Linear', 'Reinhard', 'Cineon', 'ACESFilmic', 'AgX', 'Neutral' ] as const;

export const NUMBER_SPECS = {
    'perf.dpr': { group: 'Render', label: 'pixel ratio', value: 2, min: 0.5, max: 3, step: 0.05 },

    'tone.exposure': { group: 'Tone', label: 'exposure', value: 1, min: 0, max: 3, step: 0.01 },

    'ibl.intensity': { group: 'IBL', label: 'intensity', value: 2, min: 0, max: 40, step: 0.1 },

    'bloom.intensity': { group: 'Bloom', label: 'intensity', value: 0.45, min: 0, max: 4, step: 0.01 },
    'bloom.threshold': { group: 'Bloom', label: 'threshold', value: 0.9, min: 0, max: 2, step: 0.01 },
    'bloom.smoothing': { group: 'Bloom', label: 'smoothing', value: 0.2, min: 0, max: 1, step: 0.01 },
    'bloom.radius': { group: 'Bloom', label: 'radius', value: 0.5, min: 0, max: 1, step: 0.01 },

    'deck.metalness': { group: 'Deck', label: 'metalness', value: 0.9, min: 0, max: 1, step: 0.01 },
    'deck.roughness': { group: 'Deck', label: 'roughness', value: 0.35, min: 0.02, max: 1, step: 0.01 },
    'deck.envMapIntensity': { group: 'Deck', label: 'env map', value: 1, min: 0, max: 6, step: 0.05 },
    'deck.normalScale': { group: 'Deck', label: 'normal scale', value: 0.8, min: 0, max: 3, step: 0.01 },
    'deck.plate': { group: 'Deck', label: 'plate size (u)', value: 4, min: 1, max: 24, step: 1, rebuild: true },

    'groove.width': {
        group: 'Groove',
        label: 'width (u)',
        value: 0.15,
        min: 0.02,
        max: 1.2,
        step: 0.01,
        rebuild: true,
    },
    'groove.wallTilt': {
        group: 'Groove',
        label: 'bevel tilt',
        value: 0.05,
        min: 0,
        max: 0.8,
        step: 0.01,
        rebuild: true,
    },
    'groove.bevelShare': {
        group: 'Groove',
        label: 'bevel share',
        value: 0.05,
        min: 0,
        max: 0.5,
        step: 0.01,
        rebuild: true,
    },
    'groove.metalness': { group: 'Groove', label: 'metalness', value: 0.95, min: 0, max: 1, step: 0.01, rebuild: true },
    'groove.roughness': { group: 'Groove', label: 'roughness', value: 0.95, min: 0, max: 1, step: 0.01, rebuild: true },
    'groove.contrast': { group: 'Groove', label: 'darkening', value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'groove.cavity': { group: 'Groove', label: 'cavity mask', value: 0.25, min: 0, max: 1, step: 0.01, rebuild: true },

    'rail.metalness': { group: 'Rail', label: 'metalness', value: 0.9, min: 0, max: 1, step: 0.01 },
    'rail.roughness': { group: 'Rail', label: 'roughness', value: 0.35, min: 0.02, max: 1, step: 0.01 },
    'rail.envMapIntensity': { group: 'Rail', label: 'env map', value: 1, min: 0, max: 6, step: 0.05 },
    'rail.normalScale': { group: 'Rail', label: 'normal scale', value: 0.8, min: 0, max: 3, step: 0.01 },
    'rail.plate': { group: 'Rail', label: 'plate size (u)', value: 4, min: 1, max: 24, step: 1, rebuild: true },

    'emitter.intensity': { group: 'Rail emitter', label: 'intensity', value: 10, min: 0, max: 120, step: 0.5 },
    'emitter.range': { group: 'Rail emitter', label: 'range (u)', value: 690, min: 20, max: 1200, step: 10 },
    'emitter.decay': { group: 'Rail emitter', label: 'decay', value: 2, min: 0, max: 3, step: 0.05 },
    'rail.emissive': { group: 'Rail emitter', label: 'rail emissive', value: 2, min: 0, max: 10, step: 0.05 },

    'mono.metalness': { group: 'Monolith', label: 'metalness', value: 0.9, min: 0, max: 1, step: 0.01 },
    'mono.roughness': { group: 'Monolith', label: 'roughness', value: 0.35, min: 0.02, max: 1, step: 0.01 },
    'mono.envMapIntensity': { group: 'Monolith', label: 'env map', value: 1.55, min: 0, max: 6, step: 0.05 },
    'mono.plate': { group: 'Monolith', label: 'plate size (u)', value: 17, min: 4, max: 40, step: 1, rebuild: true },
    'mono.seam': { group: 'Monolith', label: 'seam emissive', value: 10, min: 0, max: 10, step: 0.05 },
} as const satisfies Record< string, NumberSpec >;

export const COLOR_SPECS = {
    'ibl.zenith': { group: 'IBL', label: 'zenith', value: '#26292c', rebuild: true },
    'ibl.horizon': { group: 'IBL', label: 'horizon', value: '#303439', rebuild: true },
    'ibl.nadir': { group: 'IBL', label: 'nadir', value: '#1e2023', rebuild: true },
    'deck.plateColor': { group: 'Deck', label: 'plate', value: '#23272a', rebuild: true },
    'rail.plateColor': { group: 'Rail', label: 'plate', value: '#23272a', rebuild: true },
    'mono.plateColor': { group: 'Monolith', label: 'plate', value: '#313b45', rebuild: true },
} as const satisfies Record< string, ColorSpec >;

export const CHOICE_SPECS = {
    'tone.mapping': { group: 'Tone', label: 'mapping', value: 'Reinhard', options: TONE_MAPPINGS },
} as const satisfies Record< string, ChoiceSpec >;

export type NumberKey = keyof typeof NUMBER_SPECS;
export type ColorKey = keyof typeof COLOR_SPECS;
export type ChoiceKey = keyof typeof CHOICE_SPECS;

const STORAGE_KEY = 'slur.tunables';

const numbers = Object.fromEntries(
    Object.entries( NUMBER_SPECS ).map( ( [ key, spec ] ) => [ key, spec.value ] ),
) as Record< NumberKey, number >;

const colors = Object.fromEntries(
    Object.entries( COLOR_SPECS ).map( ( [ key, spec ] ) => [ key, spec.value ] ),
) as Record< ColorKey, string >;

const choices = Object.fromEntries(
    Object.entries( CHOICE_SPECS ).map( ( [ key, spec ] ) => [ key, spec.value ] ),
) as Record< ChoiceKey, string >;

export function numberSpec( key: NumberKey ): NumberSpec {
    return NUMBER_SPECS[ key ];
}

export function colorSpec( key: ColorKey ): ColorSpec {
    return COLOR_SPECS[ key ];
}

export function choiceSpec( key: ChoiceKey ): ChoiceSpec {
    return CHOICE_SPECS[ key ];
}

const listeners = new Set< () => void >();

let version = 0;
let rebuild = 0;

function clamp( spec: NumberSpec, v: number ): number {
    return Math.max( spec.min, Math.min( spec.max, v ) );
}

function persist(): void {
    try {
        localStorage.setItem( STORAGE_KEY, JSON.stringify( { numbers, colors, choices } ) );
    } catch {
        return;
    }
}

function restore(): void {
    try {
        const raw = localStorage.getItem( STORAGE_KEY );
        if ( ! raw ) return;
        const saved = JSON.parse( raw ) as {
            numbers?: Record< string, unknown >;
            colors?: Record< string, unknown >;
            choices?: Record< string, unknown >;
        };
        for ( const key of Object.keys( numbers ) as NumberKey[] ) {
            const v = saved.numbers?.[ key ];
            if ( typeof v === 'number' && Number.isFinite( v ) ) numbers[ key ] = clamp( numberSpec( key ), v );
        }
        for ( const key of Object.keys( colors ) as ColorKey[] ) {
            const v = saved.colors?.[ key ];
            if ( typeof v === 'string' ) colors[ key ] = v;
        }
        for ( const key of Object.keys( choices ) as ChoiceKey[] ) {
            const v = saved.choices?.[ key ];
            if ( typeof v === 'string' && choiceSpec( key ).options.includes( v ) ) choices[ key ] = v;
        }
    } catch {
        return;
    }
}

restore();

function announce( needsRebuild: boolean ): void {
    version++;
    if ( needsRebuild ) rebuild++;
    persist();
    for ( const listener of listeners ) listener();
}

export function subscribeTunables( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function tunablesVersion(): number {
    return version;
}

export function rebuildToken(): number {
    return rebuild;
}

export function num( key: NumberKey ): number {
    return numbers[ key ];
}

export function col( key: ColorKey ): string {
    return colors[ key ];
}

export function choice( key: ChoiceKey ): string {
    return choices[ key ];
}

export function setNum( key: NumberKey, value: number ): void {
    const next = clamp( numberSpec( key ), value );
    if ( numbers[ key ] === next ) return;
    numbers[ key ] = next;
    announce( numberSpec( key ).rebuild === true );
}

export function setCol( key: ColorKey, value: string ): void {
    if ( colors[ key ] === value ) return;
    colors[ key ] = value;
    announce( colorSpec( key ).rebuild === true );
}

export function setChoice( key: ChoiceKey, value: string ): void {
    if ( choices[ key ] === value || ! choiceSpec( key ).options.includes( value ) ) return;
    choices[ key ] = value;
    announce( false );
}

export function resetTunables(): void {
    for ( const key of Object.keys( numbers ) as NumberKey[] ) numbers[ key ] = numberSpec( key ).value;
    for ( const key of Object.keys( colors ) as ColorKey[] ) colors[ key ] = colorSpec( key ).value;
    for ( const key of Object.keys( choices ) as ChoiceKey[] ) choices[ key ] = choiceSpec( key ).value;
    announce( true );
}

if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
    Object.assign( window, { slur: { num, col, choice, setNum, setCol, setChoice, resetTunables } } );
}

export function tunablesSnapshot(): string {
    return JSON.stringify( { numbers, colors, choices }, null, 4 );
}
