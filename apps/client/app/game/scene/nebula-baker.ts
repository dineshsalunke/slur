import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { createNoiseVolume } from './nebula-noise-volume';
import { SKY_BAKE_KEYS, SKY_LOOK_KEYS, type SkyKey } from './nebula-presets';
import {
    NEBULA_BACKGROUND_FRAGMENT,
    NEBULA_BAKE_FRAGMENT,
    NEBULA_CUBE_VERTEX,
    NEBULA_LIGHT_FRAGMENT,
    NEBULA_PROBE_FRAGMENT,
    NEBULA_PROBE_VERTEX,
} from './nebula-shaders';

const FIELD_FACE = 1024;
const LIGHT_FACE = 128;
const PROBE_W = 64;
const PROBE_H = 32;
const HORIZON_HALF_SPAN = 3;
const BACKGROUND_SCALE = 100;
const KEY_LIFT = 1.4;
const KEY_DEPTH = 0.35;
const KEY_TINT = 0.45;
const DEG = Math.PI / 180;

export const NEBULA_HORIZON = new THREE.Color( 0, 0, 0 );

export const NEBULA_LIGHT = {
    environment: null as THREE.Texture | null,
    direction: new THREE.Vector3( 0, 1, 0 ),
    color: new THREE.Color( 1, 1, 1 ),
};

const SRGB_TO_LINEAR = Float32Array.from( { length: 256 }, ( _, i ) => {
    const c = i / 255;
    return c <= 0.04045 ? c / 12.92 : ( ( c + 0.055 ) / 1.055 ) ** 2.4;
} );

const _color = new THREE.Color();

function sky( key: SkyKey ): number {
    return num( `Sky.${ key }` );
}

function readInto( keys: readonly SkyKey[], state: Float64Array ): boolean {
    let changed = false;
    for ( let i = 0; i < keys.length; i++ ) {
        const v = sky( keys[ i ] );
        if ( state[ i ] !== v ) {
            state[ i ] = v;
            changed = true;
        }
    }
    return changed;
}

function cubeScene( material: THREE.ShaderMaterial ): THREE.Scene {
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh( new THREE.BoxGeometry( 2, 2, 2 ), material );
    mesh.frustumCulled = false;
    scene.add( mesh );
    return scene;
}

function cubeMaterial( fragmentShader: string, uniforms: Record< string, THREE.IUniform > ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial( {
        vertexShader: NEBULA_CUBE_VERTEX,
        fragmentShader,
        uniforms,
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
    } );
}

export class NebulaBaker {
    readonly background: THREE.Mesh;

    private readonly noise = createNoiseVolume();
    private readonly fields = new THREE.WebGLCubeRenderTarget( FIELD_FACE, {
        type: THREE.UnsignedByteType,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
    } );
    private readonly lightCube = new THREE.WebGLCubeRenderTarget( LIGHT_FACE, {
        type: THREE.HalfFloatType,
        generateMipmaps: false,
        depthBuffer: false,
    } );
    private readonly probeTarget = new THREE.WebGLRenderTarget( PROBE_W, PROBE_H, {
        type: THREE.UnsignedByteType,
        depthBuffer: false,
    } );
    private readonly probePixels = new Uint8Array( PROBE_W * PROBE_H * 4 );
    private readonly fieldCamera = new THREE.CubeCamera( 0.1, 10, this.fields );
    private readonly lightCamera = new THREE.CubeCamera( 0.1, 10, this.lightCube );
    private readonly probeCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    private pmrem: THREE.PMREMGenerator | null = null;
    private envTarget: THREE.WebGLRenderTarget | null = null;

    private readonly bandUniforms = {
        uBandNormal: { value: new THREE.Vector3( 1, 0, 0 ) },
        uBandOffset: { value: 0 },
        uBandWidth: { value: 0.3 },
    };
    private readonly bakeUniforms = {
        ...this.bandUniforms,
        uSeed: { value: new THREE.Vector3() },
        uScale: { value: 1 },
        uWarp: { value: 1 },
        uDensity: { value: 0.5 },
        uVoids: { value: 0.5 },
        uDust: { value: 0.5 },
    };
    private readonly shadeUniforms = {
        ...this.bandUniforms,
        uFields: { value: this.fields.texture },
        uNoise: { value: this.noise },
        uCloud: { value: new THREE.Color() },
        uRim: { value: new THREE.Color() },
        uDeep: { value: new THREE.Color() },
        uBrightness: { value: 1 },
        uVoidDepth: { value: 0.8 },
        uDustOpacity: { value: 0.8 },
        uRimStrength: { value: 1 },
        uClumpEdge: { value: 0.6 },
    };
    private readonly stillUniforms = {
        uTime: { value: 0 },
        uFlow: { value: 0 },
    };
    private readonly liveUniforms = {
        uTime: { value: 0 },
        uFlow: { value: 1 },
    };

    private readonly bakeMaterial = cubeMaterial( NEBULA_BAKE_FRAGMENT, this.bakeUniforms );
    private readonly lightMaterial = cubeMaterial( NEBULA_LIGHT_FRAGMENT, {
        ...this.shadeUniforms,
        ...this.stillUniforms,
    } );
    private readonly backgroundMaterial = cubeMaterial( NEBULA_BACKGROUND_FRAGMENT, {
        ...this.shadeUniforms,
        ...this.liveUniforms,
    } );
    private readonly probeMaterial = new THREE.ShaderMaterial( {
        vertexShader: NEBULA_PROBE_VERTEX,
        fragmentShader: NEBULA_PROBE_FRAGMENT,
        uniforms: { ...this.shadeUniforms, ...this.stillUniforms },
        depthTest: false,
        depthWrite: false,
    } );

    private readonly bakeScene = cubeScene( this.bakeMaterial );
    private readonly lightScene = cubeScene( this.lightMaterial );
    private readonly probeScene = new THREE.Scene();

    private readonly bakeState = new Float64Array( SKY_BAKE_KEYS.length ).fill( Number.NaN );
    private readonly lookState = new Float64Array( SKY_LOOK_KEYS.length ).fill( Number.NaN );

    constructor() {
        this.background = new THREE.Mesh( new THREE.BoxGeometry( 2, 2, 2 ), this.backgroundMaterial );
        this.background.frustumCulled = false;
        this.background.renderOrder = -1000;
        this.background.scale.setScalar( BACKGROUND_SCALE );
        this.background.onBeforeRender = ( _renderer, _scene, camera ) => {
            this.background.position.setFromMatrixPosition( camera.matrixWorld );
            this.background.updateMatrixWorld();
        };
        const probe = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.probeMaterial );
        probe.frustumCulled = false;
        this.probeScene.add( probe );
    }

    update( renderer: THREE.WebGLRenderer, elapsed: number ): void {
        let relit = false;
        if ( readInto( SKY_BAKE_KEYS, this.bakeState ) ) {
            this.applyBake();
            this.fieldCamera.update( renderer, this.bakeScene );
            relit = true;
        }
        if ( readInto( SKY_LOOK_KEYS, this.lookState ) ) {
            this.applyLook();
            relit = true;
        }
        if ( relit ) this.relight( renderer );

        this.liveUniforms.uTime.value = elapsed;
        this.liveUniforms.uFlow.value = sky( 'motion' );
    }

    dispose(): void {
        this.noise.dispose();
        this.fields.dispose();
        this.lightCube.dispose();
        this.probeTarget.dispose();
        if ( NEBULA_LIGHT.environment === this.envTarget?.texture ) NEBULA_LIGHT.environment = null;
        this.envTarget?.dispose();
        this.envTarget = null;
        this.pmrem?.dispose();
        this.pmrem = null;
        for ( const m of [ this.bakeMaterial, this.lightMaterial, this.backgroundMaterial, this.probeMaterial ] ) {
            m.dispose();
        }
        for ( const scene of [ this.bakeScene, this.lightScene, this.probeScene ] ) {
            scene.traverse( ( o ) => {
                if ( o instanceof THREE.Mesh ) o.geometry.dispose();
            } );
        }
        this.background.geometry.dispose();
        this.bakeState.fill( Number.NaN );
        this.lookState.fill( Number.NaN );
    }

    private applyBake(): void {
        const u = this.bakeUniforms;
        const seed = sky( 'seed' );
        const tilt = sky( 'bandTilt' ) * DEG;
        u.uSeed.value.set( ( seed * 37.13 ) % 97, ( seed * 53.71 ) % 89, ( seed * 71.37 ) % 83 );
        u.uScale.value = sky( 'scale' );
        u.uWarp.value = sky( 'warp' );
        u.uBandNormal.value.set( Math.cos( tilt ), Math.sin( tilt ), 0 );
        u.uBandOffset.value = sky( 'bandOffset' );
        u.uBandWidth.value = sky( 'bandWidth' );
        u.uDensity.value = sky( 'density' );
        u.uVoids.value = sky( 'voids' );
        u.uDust.value = sky( 'dust' );
    }

    private applyLook(): void {
        const u = this.shadeUniforms;
        const hue = sky( 'hue' ) / 360;
        const sat = sky( 'saturation' );
        u.uCloud.value.setHSL( hue, sat, 0.6, THREE.SRGBColorSpace );
        u.uRim.value.setHSL( hue, sat * 0.6, 0.86, THREE.SRGBColorSpace );
        u.uDeep.value.setHSL( hue, sat, 0.018, THREE.SRGBColorSpace );
        u.uBrightness.value = sky( 'brightness' );
        u.uVoidDepth.value = sky( 'voidDepth' );
        u.uDustOpacity.value = sky( 'dustOpacity' );
        u.uRimStrength.value = sky( 'rim' );
        u.uClumpEdge.value = sky( 'clumps' );
    }

    private relight( renderer: THREE.WebGLRenderer ): void {
        this.lightCamera.update( renderer, this.lightScene );
        this.pmrem ??= new THREE.PMREMGenerator( renderer );
        this.envTarget = this.pmrem.fromCubemap( this.lightCube.texture, this.envTarget );
        NEBULA_LIGHT.environment = this.envTarget.texture;

        const previous = renderer.getRenderTarget();
        renderer.setRenderTarget( this.probeTarget );
        renderer.render( this.probeScene, this.probeCamera );
        renderer.readRenderTargetPixels( this.probeTarget, 0, 0, PROBE_W, PROBE_H, this.probePixels );
        renderer.setRenderTarget( previous );
        this.measure();
    }

    private measure(): void {
        const px = this.probePixels;
        let hr = 0;
        let hg = 0;
        let hb = 0;
        let hn = 0;
        let kx = 0;
        let ky = 0;
        let kz = 0;
        let kr = 0;
        let kg = 0;
        let kb = 0;
        const midRow = PROBE_H / 2;
        const midCol = PROBE_W / 2;

        for ( let row = 0; row < PROBE_H; row++ ) {
            const lat = ( ( row + 0.5 ) / PROBE_H - 0.5 ) * Math.PI;
            const cosLat = Math.cos( lat );
            for ( let col = 0; col < PROBE_W; col++ ) {
                const lon = ( ( col + 0.5 ) / PROBE_W - 0.5 ) * Math.PI * 2;
                const i = ( row * PROBE_W + col ) * 4;
                const r = SRGB_TO_LINEAR[ px[ i ] ];
                const g = SRGB_TO_LINEAR[ px[ i + 1 ] ];
                const b = SRGB_TO_LINEAR[ px[ i + 2 ] ];
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const w = lum * lum * cosLat;
                kx += w * cosLat * Math.sin( lon );
                ky += w * Math.sin( lat );
                kz += w * cosLat * Math.cos( lon );
                kr += w * r;
                kg += w * g;
                kb += w * b;
                if ( ( row === midRow - 1 || row === midRow ) && Math.abs( col + 0.5 - midCol ) <= HORIZON_HALF_SPAN ) {
                    hr += r;
                    hg += g;
                    hb += b;
                    hn++;
                }
            }
        }

        NEBULA_HORIZON.setRGB( hr / hn, hg / hn, hb / hn, THREE.LinearSRGBColorSpace );

        const len = Math.hypot( kx, ky, kz );
        if ( len > 0 ) {
            NEBULA_LIGHT.direction.set( kx / len, ky / len + KEY_LIFT, ( kz / len ) * KEY_DEPTH ).normalize();
        }
        const peak = Math.max( kr, kg, kb );
        if ( peak > 0 ) {
            _color.setRGB( kr / peak, kg / peak, kb / peak );
            NEBULA_LIGHT.color.setRGB( 1, 1, 1 ).lerp( _color, KEY_TINT );
        }
    }
}
