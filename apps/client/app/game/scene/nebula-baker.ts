import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { NebulaEnvShell } from './nebula-env-shell';
import { noiseVolume } from './nebula-noise-volume';
import { applyPlanets, planetUniforms } from './nebula-planets';
import { SKY_BAKE_KEYS, SKY_LIVE_KEYS, SKY_LOOK_KEYS, type SkyKey } from './nebula-presets';
import { measureProbe, PROBE_H, PROBE_W, type ProbeResult } from './nebula-probe';
import {
    NEBULA_BACKGROUND_FRAGMENT,
    NEBULA_BAKE_FRAGMENT,
    NEBULA_CUBE_VERTEX,
    NEBULA_LIGHT_FRAGMENT,
    NEBULA_PROBE_FRAGMENT,
    NEBULA_PROBE_VERTEX,
} from './nebula-shaders';
import { prefersReducedMotion } from './reduced-motion';

const FIELD_FACE = 1024;
const LIGHT_FACE = 128;
const BACKGROUND_SCALE = 100;
const DEG = Math.PI / 180;

export const NEBULA_HORIZON = new THREE.Color( 0, 0, 0 );

export const NEBULA_LIGHT = {
    environment: null as THREE.Texture | null,
    direction: new THREE.Vector3( 0, 1, 0 ),
    color: new THREE.Color( 1, 1, 1 ),
};

const NEBULA_PROBE: ProbeResult = {
    horizon: NEBULA_HORIZON,
    direction: NEBULA_LIGHT.direction,
    color: NEBULA_LIGHT.color,
};

const SKY_PATHS = Object.fromEntries(
    [ ...SKY_BAKE_KEYS, ...SKY_LOOK_KEYS, ...SKY_LIVE_KEYS ].map( ( key ) => [ key, `Sky.${ key }` ] ),
) as Record< SkyKey, `Sky.${ SkyKey }` >;

function sky( key: SkyKey ): number {
    return num( SKY_PATHS[ key ] );
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

function skyBox( material: THREE.ShaderMaterial ): THREE.Mesh {
    const mesh = new THREE.Mesh( new THREE.BoxGeometry( 2, 2, 2 ), material );
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    return mesh;
}

export class NebulaBaker {
    readonly background: THREE.Mesh;

    private readonly still = prefersReducedMotion();
    private readonly noise = noiseVolume();
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
    private readonly planets = planetUniforms();
    private readonly shadeUniforms = {
        ...this.bandUniforms,
        ...this.planets,
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
    private readonly lightMaterial: THREE.ShaderMaterial;

    private readonly bakeScene = new THREE.Scene().add( skyBox( this.bakeMaterial ) );
    private readonly lightScene = new THREE.Scene();
    private readonly probeScene = new THREE.Scene();
    private readonly shell: NebulaEnvShell;

    private readonly bakeState = new Float64Array( SKY_BAKE_KEYS.length ).fill( Number.NaN );
    private readonly lookState = new Float64Array( SKY_LOOK_KEYS.length ).fill( Number.NaN );

    constructor() {
        this.background = skyBox( this.backgroundMaterial );
        this.background.scale.setScalar( BACKGROUND_SCALE );
        this.background.onBeforeRender = ( _renderer, _scene, camera ) => {
            this.background.position.setFromMatrixPosition( camera.matrixWorld );
            this.background.updateMatrixWorld();
        };

        const gain = { value: 1 };
        const fill = { value: new THREE.Color( 0, 0, 0 ) };
        this.lightMaterial = cubeMaterial( NEBULA_LIGHT_FRAGMENT, {
            ...this.shadeUniforms,
            ...this.stillUniforms,
            uEnvGain: gain,
            uEnvFill: fill,
        } );
        this.shell = new NebulaEnvShell( this.lightScene, skyBox( this.lightMaterial ), gain, fill );

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
        if ( this.shell.read() ) {
            this.shell.apply();
            relit = true;
        }
        if ( relit ) this.relight( renderer );

        this.liveUniforms.uTime.value = this.still ? 0 : elapsed;
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
        this.shell.dispose();
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
        applyPlanets( this.planets );
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
        measureProbe( this.probePixels, NEBULA_PROBE );
    }
}
