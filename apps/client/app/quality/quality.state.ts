import {
    DEFAULT_TIER,
    NO_CANVAS_PARAM,
    PROFILES,
    QUALITY_KEY,
    QUALITY_PARAM,
    type QualityProfile,
    type QualityTier,
} from './quality.constants';
import { type DeviceProbe, detectTier, lowerTier, parseTier } from './quality.utils';

export type QualitySource = 'flag' | 'saved' | 'auto';

export interface Quality {
    tier: QualityTier;
    source: QualitySource;
    detected: QualityTier;
    canvasAllowed: boolean;
    backdrop3d: boolean;
    renderer: string;
}

type QualityBase = Omit< Quality, 'tier' | 'source' | 'backdrop3d' >;

const SERVER: Quality = {
    tier: DEFAULT_TIER,
    source: 'auto',
    detected: DEFAULT_TIER,
    canvasAllowed: false,
    backdrop3d: false,
    renderer: '',
};

let current: Quality | null = null;
const listeners = new Set< () => void >();

function probeDevice(): DeviceProbe {
    const strict = document.createElement( 'canvas' ).getContext( 'webgl2', { failIfMajorPerformanceCaveat: true } );
    const gl = strict ?? document.createElement( 'canvas' ).getContext( 'webgl2' );
    const info = gl?.getExtension( 'WEBGL_debug_renderer_info' );
    const renderer = gl ? String( gl.getParameter( info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER ) ?? '' ) : '';
    gl?.getExtension( 'WEBGL_lose_context' )?.loseContext();
    return {
        webgl2: gl !== null,
        majorCaveat: gl !== null && strict === null,
        renderer,
        coarse: window.matchMedia( '(pointer: coarse)' ).matches,
        cores: navigator.hardwareConcurrency ?? 0,
        memoryGb: ( navigator as { deviceMemory?: number } ).deviceMemory,
    };
}

function savedTier(): QualityTier | null {
    try {
        return parseTier( localStorage.getItem( QUALITY_KEY ) );
    } catch {
        return null;
    }
}

function withTier( base: QualityBase, tier: QualityTier, source: QualitySource ): Quality {
    return {
        canvasAllowed: base.canvasAllowed,
        detected: base.detected,
        renderer: base.renderer,
        tier,
        source,
        backdrop3d: base.canvasAllowed && PROFILES[ tier ].landing3d,
    };
}

function resolve(): Quality {
    const params = new URLSearchParams( window.location.search );
    const probe = probeDevice();
    const detected = detectTier( probe );
    const flag = parseTier( params.get( QUALITY_PARAM ) );
    const saved = savedTier();
    const tier = flag ?? saved ?? detected;
    const source: QualitySource = flag ? 'flag' : saved ? 'saved' : 'auto';
    const canvasAllowed = probe.webgl2 && ! params.has( NO_CANVAS_PARAM );
    return withTier( { canvasAllowed, detected, renderer: probe.renderer }, tier, source );
}

function publish( next: Quality ): void {
    current = next;
    for ( const notify of listeners ) notify();
}

export function quality(): Quality {
    if ( typeof window === 'undefined' ) return SERVER;
    current ??= resolve();
    return current;
}

export function qualityProfile(): QualityProfile {
    return PROFILES[ quality().tier ];
}

export function serverQuality(): Quality {
    return SERVER;
}

export function subscribeQuality( notify: () => void ): () => void {
    listeners.add( notify );
    return () => listeners.delete( notify );
}

export function setQualityTier( tier: QualityTier ): void {
    try {
        localStorage.setItem( QUALITY_KEY, tier );
    } catch {}
    publish( withTier( quality(), tier, 'saved' ) );
}

export function clearQualityTier(): void {
    try {
        localStorage.removeItem( QUALITY_KEY );
    } catch {}
    const was = quality();
    publish( withTier( was, was.detected, 'auto' ) );
}

export function stepDownQuality(): void {
    const was = quality();
    if ( was.source !== 'auto' || was.tier === 'low' ) return;
    publish( withTier( was, lowerTier( was.tier ), 'auto' ) );
}

export function dropBackdrop3d(): void {
    const was = quality();
    if ( was.canvasAllowed ) publish( withTier( { ...was, canvasAllowed: false }, was.tier, was.source ) );
}
