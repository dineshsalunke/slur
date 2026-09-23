import { button, useControls } from 'leva';
import { col, num, setCol, setNum } from './tuning';
import { copyDefaults } from './tuning-export';
import { forget } from './tuning-persist';
import { type ColorPath, NUMBER_TUNABLES, type NumberPath } from './tuning-schema';

function numberControl( path: NumberPath ) {
    const spec = NUMBER_TUNABLES[ path ];
    return {
        value: num( path ),
        min: spec.min,
        max: spec.max,
        step: spec.step,
        onChange: ( value: number ) => setNum( path, value ),
        transient: true as const,
    };
}

function colorControl( path: ColorPath ) {
    return {
        value: col( path ),
        onChange: ( value: string ) => setCol( path, value ),
        transient: true as const,
    };
}

export function TuningPanel() {
    useControls( 'Render', {
        dpr: numberControl( 'Render.dpr' ),
        device: { value: String( devicePixelRatio ), editable: false },
    } );

    useControls( 'Environment', {
        skyColor: colorControl( 'Env.skyColor' ),
        skyIntensity: numberControl( 'Env.skyIntensity' ),
        groundColor: colorControl( 'Env.groundColor' ),
        groundIntensity: numberControl( 'Env.groundIntensity' ),
        bandColor: colorControl( 'Env.bandColor' ),
        bandIntensity: numberControl( 'Env.bandIntensity' ),
        bandHeight: numberControl( 'Env.bandHeight' ),
        intensity: numberControl( 'Environment.intensity' ),
        rotation: numberControl( 'Environment.rotation' ),
    } );

    useControls( 'Rail lights', {
        intensity: numberControl( 'RailLight.intensity' ),
        span: numberControl( 'RailLight.span' ),
        thickness: numberControl( 'RailLight.thickness' ),
        lift: numberControl( 'RailLight.lift' ),
        stride: numberControl( 'RailLight.stride' ),
        offset: numberControl( 'RailLight.offset' ),
        color: colorControl( 'RailLight.color' ),
    } );

    useControls( 'Bloom', {
        intensity: numberControl( 'Bloom.intensity' ),
        threshold: numberControl( 'Bloom.threshold' ),
        smoothing: numberControl( 'Bloom.smoothing' ),
    } );

    useControls( 'Tuning', {
        'copy changed defaults': button( copyDefaults ),
        'reset to schema': button( () => {
            forget();
            location.reload();
        } ),
    } );

    useControls( 'Near fill', {
        intensity: numberControl( 'NearFill.intensity' ),
        forward: numberControl( 'NearFill.forward' ),
        height: numberControl( 'NearFill.height' ),
        distance: numberControl( 'NearFill.distance' ),
        color: colorControl( 'NearFill.color' ),
    } );

    useControls( 'Fill', {
        intensity: numberControl( 'Fill.intensity' ),
        elevation: numberControl( 'Fill.elevation' ),
        azimuth: numberControl( 'Fill.azimuth' ),
        color: colorControl( 'Fill.color' ),
    } );

    useControls( 'Fog', {
        near: numberControl( 'Fog.near' ),
        far: numberControl( 'Fog.far' ),
        color: colorControl( 'Fog.color' ),
    } );

    useControls( 'Metal', {
        baseColor: colorControl( 'Metal.baseColor' ),
        mapTint: colorControl( 'Metal.mapTint' ),
    } );

    useControls( 'Shadow', {
        color: colorControl( 'Shadow.color' ),
        opacity: numberControl( 'Shadow.opacity' ),
        size: numberControl( 'Shadow.size' ),
        spread: numberControl( 'Shadow.spread' ),
        softness: numberControl( 'Shadow.softness' ),
        blur: numberControl( 'Shadow.blur' ),
        reach: numberControl( 'Shadow.reach' ),
        lift: numberControl( 'Shadow.lift' ),
    } );

    useControls( 'Deck', {
        metalness: numberControl( 'Deck.metalness' ),
        roughness: numberControl( 'Deck.roughness' ),
        envMapIntensity: numberControl( 'Deck.envMapIntensity' ),
        normalScale: numberControl( 'Deck.normalScale' ),
        plate: numberControl( 'Deck.plate' ),
        seamEmissive: numberControl( 'Deck.seamEmissive' ),
    } );

    useControls( 'Rail', {
        metalness: numberControl( 'Rail.metalness' ),
        roughness: numberControl( 'Rail.roughness' ),
        envMapIntensity: numberControl( 'Rail.envMapIntensity' ),
        normalScale: numberControl( 'Rail.normalScale' ),
        plate: numberControl( 'Rail.plate' ),
        railEmissive: numberControl( 'Rail.railEmissive' ),
        rimEmissive: numberControl( 'Rail.rimEmissive' ),
    } );

    useControls( 'Monolith', {
        metalness: numberControl( 'Monolith.metalness' ),
        roughness: numberControl( 'Monolith.roughness' ),
        envMapIntensity: numberControl( 'Monolith.envMapIntensity' ),
        textureSpan: numberControl( 'Monolith.textureSpan' ),
        normalScale: numberControl( 'Monolith.normalScale' ),
        seamEmissive: numberControl( 'Monolith.seamEmissive' ),
    } );

    useControls( 'Block', {
        textureSpan: numberControl( 'Block.textureSpan' ),
        normalScale: numberControl( 'Block.normalScale' ),
        roughness: numberControl( 'Block.roughness' ),
        metalness: numberControl( 'Block.metalness' ),
        envMapIntensity: numberControl( 'Block.envMapIntensity' ),
        seamEmissive: numberControl( 'Block.seamEmissive' ),
        wear: numberControl( 'Block.wear' ),
    } );

    useControls( 'Groove', {
        width: numberControl( 'Groove.width' ),
        wallTilt: numberControl( 'Groove.wallTilt' ),
        bevelShare: numberControl( 'Groove.bevelShare' ),
        metalness: numberControl( 'Groove.metalness' ),
        roughness: numberControl( 'Groove.roughness' ),
        darkening: numberControl( 'Groove.darkening' ),
        cavity: numberControl( 'Groove.cavity' ),
    } );

    useControls( 'Exhaust', {
        length: numberControl( 'Exhaust.length' ),
        spread: numberControl( 'Exhaust.spread' ),
        glow: numberControl( 'Exhaust.glow' ),
        idle: numberControl( 'Exhaust.idle' ),
        softness: numberControl( 'Exhaust.softness' ),
        falloff: numberControl( 'Exhaust.falloff' ),
        heat: numberControl( 'Exhaust.heat' ),
        hot: colorControl( 'Exhaust.hot' ),
        cool: colorControl( 'Exhaust.cool' ),
    } );

    useControls( 'Hover', {
        base: numberControl( 'Hover.base' ),
        speedLift: numberControl( 'Hover.speedLift' ),
        follow: numberControl( 'Hover.follow' ),
        bob: numberControl( 'Hover.bob' ),
        bobRate: numberControl( 'Hover.bobRate' ),
    } );

    useControls( 'Chase camera', {
        back: numberControl( 'Chase.back' ),
        backStretch: numberControl( 'Chase.backStretch' ),
        height: numberControl( 'Chase.height' ),
        lookAhead: numberControl( 'Chase.lookAhead' ),
        lookAtLift: numberControl( 'Chase.lookAtLift' ),
        fov: numberControl( 'Chase.fov' ),
        fovStretch: numberControl( 'Chase.fovStretch' ),
        follow: numberControl( 'Chase.follow' ),
    } );

    useControls( 'Engine light', {
        intensity: numberControl( 'EngineLight.intensity' ),
        distance: numberControl( 'EngineLight.distance' ),
        back: numberControl( 'EngineLight.back' ),
        lift: numberControl( 'EngineLight.lift' ),
        color: colorControl( 'EngineLight.color' ),
    } );

    return null;
}

export default TuningPanel;
