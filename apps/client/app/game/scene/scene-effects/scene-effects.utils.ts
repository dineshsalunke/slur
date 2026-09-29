import type { RootState } from '@react-three/fiber';
import type { World } from 'koota';
import {
    BlendFunction,
    type Effect,
    EffectAttribute,
    EffectComposer,
    EffectPass,
    type Pass,
    RenderPass,
    ToneMappingEffect,
    ToneMappingMode,
} from 'postprocessing';
import { type Camera, HalfFloatType, NoToneMapping } from 'three';
import { num } from '../../../dev/tuning';
import { qualityProfile } from '../../../quality/quality.state';
import { composerToneMode, toneExposure, toneMode } from '../tone-mapping';
import { POST_CHAIN } from './post-effects.constants';
import { AUTO_MSAA_MAX_DPR, AUTO_MSAA_SAMPLES, type POST_SLOTS } from './scene-effects.constants';

export type PostSlot = ( typeof POST_SLOTS )[ number ];

export interface PostEffect {
    id: string;
    slot: PostSlot;
    create(): Effect;
    update( effect: Effect, world: World, state: RootState ): void;
}

export interface ScenePipeline {
    world: World;
    composer: EffectComposer | null;
    effects: Effect[];
    tone: ToneMappingEffect | null;
    size: RootState[ 'size' ] | null;
    camera: Camera | null;
}

export function msaaSamples( dpr: number ): number {
    const manual = num( 'Render.msaa' );
    if ( manual >= 0 ) return manual;
    if ( ! qualityProfile().msaa ) return 0;
    return dpr < AUTO_MSAA_MAX_DPR ? AUTO_MSAA_SAMPLES : 0;
}

export function effectPasses( camera: Camera, effects: readonly Effect[] ): Pass[] {
    const passes: Pass[] = [];
    let run: Effect[] = [];
    for ( const effect of effects ) {
        if ( ( effect.getAttributes() & EffectAttribute.CONVOLUTION ) === 0 ) {
            run.push( effect );
            continue;
        }
        if ( run.length > 0 ) passes.push( new EffectPass( camera, ...run ) );
        run = [];
        passes.push( new EffectPass( camera, effect ) );
    }
    if ( run.length > 0 ) passes.push( new EffectPass( camera, ...run ) );
    return passes;
}

function buildComposer( p: ScenePipeline, state: RootState ): EffectComposer {
    const composer = new EffectComposer( state.gl, { multisampling: 0, frameBufferType: HalfFloatType } );
    composer.addPass( new RenderPass( state.scene, state.camera ) );
    const effects = POST_CHAIN.map( ( def ) => def.create() );
    const tone = new ToneMappingEffect( { mode: ToneMappingMode.NEUTRAL } );
    for ( const pass of effectPasses( state.camera, [ ...effects, tone ] ) ) composer.addPass( pass );
    p.composer = composer;
    p.effects = effects;
    p.tone = tone;
    p.size = null;
    p.camera = state.camera;
    return composer;
}

export function disposeComposer( p: ScenePipeline ): void {
    p.composer?.dispose();
    p.composer = null;
    p.effects = [];
    p.tone = null;
    p.size = null;
    p.camera = null;
}

function updateTone( tone: ToneMappingEffect ): void {
    const mode = composerToneMode( toneMode() );
    const blend = mode === undefined ? BlendFunction.DST : BlendFunction.SRC;
    if ( tone.blendMode.blendFunction !== blend ) tone.blendMode.blendFunction = blend;
    if ( mode !== undefined ) tone.mode = mode;
}

export function syncPost( p: ScenePipeline, state: RootState ): void {
    if ( ! qualityProfile().post ) {
        if ( p.composer ) disposeComposer( p );
        return;
    }
    const composer = p.composer ?? buildComposer( p, state );
    if ( p.camera !== state.camera ) {
        composer.setMainCamera( state.camera );
        p.camera = state.camera;
    }
    if ( p.size !== state.size ) {
        composer.setSize( state.size.width, state.size.height );
        p.size = state.size;
    }
    for ( let i = 0; i < POST_CHAIN.length; i++ ) POST_CHAIN[ i ].update( p.effects[ i ], p.world, state );
    if ( p.tone ) updateTone( p.tone );
    const samples = msaaSamples( state.gl.getPixelRatio() );
    if ( composer.multisampling !== samples ) composer.multisampling = samples;
}

export function renderScene( p: ScenePipeline, state: RootState, delta: number ): void {
    const { gl } = state;
    gl.toneMappingExposure = toneExposure();
    if ( p.composer ) {
        if ( gl.toneMapping !== NoToneMapping ) gl.toneMapping = NoToneMapping;
        const autoClear = gl.autoClear;
        gl.autoClear = true;
        p.composer.render( delta );
        gl.autoClear = autoClear;
        return;
    }
    const mode = toneMode();
    if ( gl.toneMapping !== mode ) gl.toneMapping = mode;
    gl.render( state.scene, state.camera );
}
