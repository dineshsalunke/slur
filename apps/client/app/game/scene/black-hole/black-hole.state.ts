import type { RootState } from '@react-three/fiber';
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { col, num, tuningVersion } from '../../../dev/tuning';
import { BAKE_BANDS, BAKE_FOV, DEG, DISK_OUTER, REFINE_BANDS, type TierPlan } from './black-hole.constants';
import { type Landmark, type LandmarkConfig, placeLandmark } from './black-hole.utils';
import { SHADE_FRAG } from './black-hole-disk.constants';
import { BAKE_FRAG, LENS_FRAG, REFINE_FRAG } from './black-hole-geodesic.constants';
import { QUAD_FRAG, QUAD_VERT } from './black-hole-quad.constants';
import { gbufferTarget, noiseTexture, pass, target } from './black-hole-resources.utils';

type Stage = 'bake' | 'refine' | 'lens' | 'live' | 'frozen';

interface Geometry {
    uResolution: THREE.IUniform< THREE.Vector2 >;
    uPitch: THREE.IUniform< number >;
    uRoll: THREE.IUniform< number >;
    uOrbit: THREE.IUniform< number >;
    uFov: THREE.IUniform< number >;
    uDiskOuter: THREE.IUniform< number >;
}

export interface BlackHole {
    plan: TierPlan;
    finishZ: number;
    mesh: THREE.Mesh | null;
    quad: FullScreenQuad;
    gbuffer: THREE.WebGLRenderTarget;
    aa: THREE.WebGLRenderTarget;
    lens: THREE.WebGLRenderTarget;
    shade: THREE.WebGLRenderTarget;
    noise: THREE.Data3DTexture;
    geometry: Geometry;
    bake: THREE.RawShaderMaterial;
    refine: THREE.RawShaderMaterial;
    lensPass: THREE.RawShaderMaterial;
    shadePass: THREE.RawShaderMaterial;
    material: THREE.ShaderMaterial;
    stage: Stage;
    band: number;
    frame: number;
    time: number;
    shaded: boolean;
    tuning: number;
    config: LandmarkConfig;
    landmark: Landmark;
}

export function createBlackHole( plan: TierPlan, finishZ: number, backdrop: THREE.Texture ): BlackHole {
    const gbuffer = gbufferTarget( plan.size );
    const aa = target( plan.size, 2 );
    const lens = target( plan.size, 1 );
    const shade = target( plan.size, 1 );
    const noise = noiseTexture();
    const [ hit1, hit2, sky, view ] = gbuffer.textures;
    const [ coverage, geom ] = aa.textures;
    const geometry: Geometry = {
        uResolution: { value: new THREE.Vector2( plan.size, plan.size ) },
        uPitch: { value: 0 },
        uRoll: { value: 0 },
        uOrbit: { value: 0 },
        uFov: { value: BAKE_FOV },
        uDiskOuter: { value: DISK_OUTER },
    };
    const material = new THREE.ShaderMaterial( {
        name: 'BlackHoleMaterial',
        uniforms: {
            uShade: { value: shade.texture },
            uLens: { value: lens.texture },
            uBackdrop: { value: backdrop },
            uBackdropTransform: { value: backdrop.matrix },
            uHalfUv: { value: new THREE.Vector2() },
            uLensStrength: { value: 0 },
            uEdge: { value: 0.8 },
        },
        vertexShader: QUAD_VERT,
        fragmentShader: QUAD_FRAG,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
    } );
    return {
        plan,
        finishZ,
        mesh: null,
        quad: new FullScreenQuad(),
        gbuffer,
        aa,
        lens,
        shade,
        noise,
        geometry,
        bake: pass( BAKE_FRAG, { ...geometry } ),
        refine: pass( REFINE_FRAG, { ...geometry, gHit1: { value: hit1 }, gSky: { value: sky } } ),
        lensPass: pass( LENS_FRAG, { ...geometry, gSky: { value: sky } } ),
        shadePass: pass( SHADE_FRAG, {
            gHit1: { value: hit1 },
            gHit2: { value: hit2 },
            gSky: { value: sky },
            gView: { value: view },
            gAa: { value: coverage },
            gAaGeom: { value: geom },
            uNoise: { value: noise },
            uTime: { value: 0 },
            uYaw: { value: 0 },
            uDiskOuter: geometry.uDiskOuter,
            uBrightness: { value: 1 },
            uSpeed: { value: 1 },
            uDoppler: { value: 1 },
            uDeep: { value: new THREE.Color() },
            uMid: { value: new THREE.Color() },
            uHot: { value: new THREE.Color() },
        } ),
        material,
        stage: 'bake',
        band: 0,
        frame: 0,
        time: 0,
        shaded: false,
        tuning: -1,
        config: { behind: 0, height: 0, radius: 0, minAngle: 0, parallax: 0 },
        landmark: { visible: false, x: 0, y: 0, z: 0, half: 0, drawDistance: 0, yaw: 0 },
    };
}

export function disposeBlackHole( hole: BlackHole ): void {
    hole.gbuffer.dispose();
    hole.aa.dispose();
    hole.lens.dispose();
    hole.shade.dispose();
    hole.noise.dispose();
    hole.bake.dispose();
    hole.refine.dispose();
    hole.lensPass.dispose();
    hole.shadePass.dispose();
    hole.material.dispose();
    hole.quad.dispose();
}

function syncTuning( hole: BlackHole ): void {
    const version = tuningVersion();
    if ( version === hole.tuning ) return;
    hole.tuning = version;
    const g = hole.geometry;
    const pitch = num( 'BlackHole.pitch' ) * DEG;
    const roll = num( 'BlackHole.roll' ) * DEG;
    const orbit = num( 'BlackHole.distance' );
    if ( pitch !== g.uPitch.value || roll !== g.uRoll.value || orbit !== g.uOrbit.value ) {
        g.uPitch.value = pitch;
        g.uRoll.value = roll;
        g.uOrbit.value = orbit;
        hole.stage = 'bake';
        hole.band = 0;
    }
    const s = hole.shadePass.uniforms;
    s.uBrightness.value = num( 'BlackHole.brightness' );
    s.uSpeed.value = num( 'BlackHole.speed' );
    s.uDoppler.value = num( 'BlackHole.doppler' );
    ( s.uDeep.value as THREE.Color ).set( col( 'BlackHole.deep' ) );
    ( s.uMid.value as THREE.Color ).set( col( 'BlackHole.mid' ) );
    ( s.uHot.value as THREE.Color ).set( col( 'BlackHole.hot' ) );
    const m = hole.material.uniforms;
    m.uLensStrength.value = num( 'BlackHole.lens' );
    m.uEdge.value = num( 'BlackHole.edge' );
    const c = hole.config;
    c.behind = num( 'BlackHole.behind' );
    c.height = num( 'BlackHole.height' );
    c.radius = num( 'BlackHole.radius' );
    c.minAngle = num( 'BlackHole.minAngle' );
    c.parallax = num( 'BlackHole.parallax' );
}

export function placeBlackHole( hole: BlackHole, state: RootState ): void {
    syncTuning( hole );
    const mesh = hole.mesh;
    if ( ! mesh ) return;
    const cam = state.camera;
    const l = placeLandmark( cam.position.x, cam.position.y, cam.position.z, hole.finishZ, hole.config, hole.landmark );
    mesh.visible = l.visible && hole.shaded;
    if ( ! l.visible ) return;
    mesh.position.set( l.x, l.y, l.z );
    mesh.scale.setScalar( l.half );
    const p = cam.projectionMatrix.elements;
    const k = ( l.half / l.drawDistance ) * 0.5;
    ( hole.material.uniforms.uHalfUv.value as THREE.Vector2 ).set( k * p[ 0 ], k * p[ 5 ] );
    hole.shadePass.uniforms.uYaw.value = l.yaw;
}

function draw(
    hole: BlackHole,
    gl: THREE.WebGLRenderer,
    material: THREE.Material,
    out: THREE.WebGLRenderTarget,
): void {
    hole.quad.material = material;
    gl.setRenderTarget( out );
    hole.quad.render( gl );
}

function drawBand(
    hole: BlackHole,
    gl: THREE.WebGLRenderer,
    material: THREE.Material,
    out: THREE.WebGLRenderTarget,
    bands: number,
): boolean {
    const size = hole.plan.size;
    const y0 = Math.floor( ( hole.band * size ) / bands );
    const y1 = Math.floor( ( ( hole.band + 1 ) * size ) / bands );
    out.scissor.set( 0, y0, size, y1 - y0 );
    out.scissorTest = true;
    draw( hole, gl, material, out );
    out.scissorTest = false;
    hole.band++;
    if ( hole.band < bands ) return false;
    hole.band = 0;
    return true;
}

function advanceBake( hole: BlackHole, gl: THREE.WebGLRenderer ): void {
    if ( hole.stage === 'bake' ) {
        if ( drawBand( hole, gl, hole.bake, hole.gbuffer, BAKE_BANDS ) ) hole.stage = 'refine';
    } else if ( hole.stage === 'refine' ) {
        if ( drawBand( hole, gl, hole.refine, hole.aa, REFINE_BANDS ) ) hole.stage = 'lens';
    } else if ( hole.stage === 'lens' ) {
        draw( hole, gl, hole.lensPass, hole.lens );
        hole.stage = 'live';
        hole.frame = 0;
    }
}

function shadeLive( hole: BlackHole, gl: THREE.WebGLRenderer ): void {
    if ( hole.frame % hole.plan.shadeEvery === 0 ) {
        hole.shadePass.uniforms.uTime.value = hole.time;
        draw( hole, gl, hole.shadePass, hole.shade );
        hole.shaded = true;
        if ( hole.plan.frozen ) hole.stage = 'frozen';
    }
    hole.frame++;
}

export function runBlackHole( hole: BlackHole, state: RootState, delta: number ): void {
    if ( hole.stage === 'frozen' ) return;
    hole.time += delta;
    const gl = state.gl;
    const previous = gl.getRenderTarget();
    const autoClear = gl.autoClear;
    gl.autoClear = false;
    advanceBake( hole, gl );
    if ( hole.stage === 'live' && ( ! hole.shaded || hole.landmark.visible ) ) shadeLive( hole, gl );
    gl.setRenderTarget( previous );
    gl.autoClear = autoClear;
}
