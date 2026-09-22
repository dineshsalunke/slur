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

export const NUMBER_SPECS = {
    'perf.dpr': { group: 'Render', label: 'pixel ratio', value: 2, min: 0.5, max: 3, step: 0.05 },

    'cam.back': { group: 'Camera', label: 'back (u)', value: 12, min: 0, max: 60, step: 0.1 },
    'cam.backStretch': { group: 'Camera', label: 'back @ speed', value: 0, min: 0, max: 20, step: 0.1 },
    'cam.height': { group: 'Camera', label: 'height (u)', value: 5, min: 0, max: 40, step: 0.1 },
    'cam.lookAhead': { group: 'Camera', label: 'look ahead (u)', value: 14, min: -20, max: 80, step: 0.5 },
    'cam.lookAtLift': { group: 'Camera', label: 'look lift (u)', value: 1, min: -10, max: 20, step: 0.05 },
    'cam.fov': { group: 'Camera', label: 'fov', value: 70, min: 20, max: 120, step: 0.5 },
    'cam.fovStretch': { group: 'Camera', label: 'fov @ speed', value: 0, min: 0, max: 60, step: 0.5 },
    'cam.follow': { group: 'Camera', label: 'follow damp', value: 20, min: 0.5, max: 60, step: 0.5 },

    'deck.metalness': { group: 'Deck', label: 'metalness', value: 0.9, min: 0, max: 1, step: 0.01 },
    'deck.roughness': { group: 'Deck', label: 'roughness', value: 0.35, min: 0.02, max: 1, step: 0.01 },
    'deck.envMapIntensity': { group: 'Deck', label: 'env map', value: 1, min: 0, max: 6, step: 0.05 },
    'deck.normalScale': { group: 'Deck', label: 'normal scale', value: 0.8, min: 0, max: 3, step: 0.01 },
    'deck.plate': { group: 'Deck', label: 'plate size (u)', value: 4, min: 1, max: 24, step: 1, rebuild: true },
    'seam.emissive': { group: 'Deck', label: 'seam emissive', value: 2, min: 0, max: 10, step: 0.05 },

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
    'groove.metalness': { group: 'Groove', label: 'metalness', value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'groove.roughness': { group: 'Groove', label: 'roughness', value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'groove.contrast': { group: 'Groove', label: 'darkening', value: 1, min: 0, max: 1, step: 0.01, rebuild: true },
    'groove.cavity': { group: 'Groove', label: 'cavity mask', value: 0.3, min: 0, max: 1, step: 0.01, rebuild: true },

    'rail.metalness': { group: 'Rail', label: 'metalness', value: 0.9, min: 0, max: 1, step: 0.01 },
    'rail.roughness': { group: 'Rail', label: 'roughness', value: 0.35, min: 0.02, max: 1, step: 0.01 },
    'rail.envMapIntensity': { group: 'Rail', label: 'env map', value: 1, min: 0, max: 6, step: 0.05 },
    'rail.normalScale': { group: 'Rail', label: 'normal scale', value: 0.8, min: 0, max: 3, step: 0.01 },
    'rail.plate': { group: 'Rail', label: 'plate size (u)', value: 4, min: 1, max: 24, step: 1, rebuild: true },

    'rail.emissive': { group: 'Rail', label: 'rail emissive', value: 2, min: 0, max: 10, step: 0.05 },
    'rim.emissive': { group: 'Rail', label: 'gap rim emissive', value: 6, min: 0, max: 30, step: 0.05 },

    'mono.metalness': { group: 'Monolith', label: 'metalness', value: 0.9, min: 0, max: 1, step: 0.01 },
    'mono.roughness': { group: 'Monolith', label: 'roughness', value: 0.35, min: 0.02, max: 1, step: 0.01 },
    'mono.envMapIntensity': { group: 'Monolith', label: 'env map', value: 1.55, min: 0, max: 6, step: 0.05 },
    'mono.plate': { group: 'Monolith', label: 'plate size (u)', value: 17, min: 4, max: 40, step: 1, rebuild: true },
    'mono.seam': { group: 'Monolith', label: 'seam emissive', value: 10, min: 0, max: 10, step: 0.05 },

    'block.bevel': { group: 'Blocks', label: 'chamfer (u)', value: 0.12, min: 0, max: 0.6, step: 0.01 },
    'block.seamWidth': { group: 'Blocks', label: 'seam width (u)', value: 0.14, min: 0.02, max: 1, step: 0.01 },
    'block.seam': { group: 'Blocks', label: 'seam emissive', value: 6, min: 0, max: 30, step: 0.05 },
    'block.wear': { group: 'Blocks', label: 'wear strength', value: 0.6, min: 0, max: 1, step: 0.01 },
    'block.roughness': { group: 'Blocks', label: 'coating roughness', value: 0.52, min: 0.02, max: 1, step: 0.01 },

    'level.blockDensity': {
        group: 'Level',
        label: 'block density',
        value: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
        rebuild: true,
    },
    'level.gapChance': { group: 'Level', label: 'gap chance', value: 1, min: 0, max: 1, step: 0.05, rebuild: true },
} as const satisfies Record< string, NumberSpec >;

export const COLOR_SPECS = {
    'deck.plateColor': { group: 'Deck', label: 'plate', value: '#23272a', rebuild: true },
    'rail.plateColor': { group: 'Rail', label: 'plate', value: '#23272a', rebuild: true },
    'mono.plateColor': { group: 'Monolith', label: 'plate', value: '#313b45', rebuild: true },
} as const satisfies Record< string, ColorSpec >;

export type NumberKey = keyof typeof NUMBER_SPECS;
export type ColorKey = keyof typeof COLOR_SPECS;

const STORAGE_KEY = 'slur.tunables';

const numbers = Object.fromEntries(
    Object.entries( NUMBER_SPECS ).map( ( [ key, spec ] ) => [ key, spec.value ] ),
) as Record< NumberKey, number >;

const colors = Object.fromEntries(
    Object.entries( COLOR_SPECS ).map( ( [ key, spec ] ) => [ key, spec.value ] ),
) as Record< ColorKey, string >;

export function numberSpec( key: NumberKey ): NumberSpec {
    return NUMBER_SPECS[ key ];
}

export function colorSpec( key: ColorKey ): ColorSpec {
    return COLOR_SPECS[ key ];
}

const listeners = new Set< () => void >();

let version = 0;
let rebuild = 0;

function clamp( spec: NumberSpec, v: number ): number {
    return Math.max( spec.min, Math.min( spec.max, v ) );
}

function persist(): void {
    try {
        localStorage.setItem( STORAGE_KEY, JSON.stringify( { numbers, colors } ) );
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
        };
        for ( const key of Object.keys( numbers ) as NumberKey[] ) {
            const v = saved.numbers?.[ key ];
            if ( typeof v === 'number' && Number.isFinite( v ) ) numbers[ key ] = clamp( numberSpec( key ), v );
        }
        for ( const key of Object.keys( colors ) as ColorKey[] ) {
            const v = saved.colors?.[ key ];
            if ( typeof v === 'string' ) colors[ key ] = v;
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

export function resetTunables(): void {
    for ( const key of Object.keys( numbers ) as NumberKey[] ) numbers[ key ] = numberSpec( key ).value;
    for ( const key of Object.keys( colors ) as ColorKey[] ) colors[ key ] = colorSpec( key ).value;
    announce( true );
}

if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
    Object.assign( window, { slur: { num, col, setNum, setCol, resetTunables } } );
}

export function tunablesSnapshot(): string {
    return JSON.stringify( { numbers, colors }, null, 4 );
}
