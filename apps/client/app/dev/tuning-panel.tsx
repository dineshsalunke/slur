import { button, useControls } from 'leva';
import {
    DEEP_SPACE_PRESET,
    NEBULA_PRESET,
    SKY_BAKE_KEYS,
    SKY_LIVE_KEYS,
    SKY_LOOK_KEYS,
    type SkyKey,
} from '../game/scene/nebula-presets';
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

function skyControls() {
    const keys: readonly SkyKey[] = [ ...SKY_BAKE_KEYS, ...SKY_LOOK_KEYS, ...SKY_LIVE_KEYS ];
    return Object.fromEntries( keys.map( ( key ) => [ key, numberControl( `Sky.${ key }` ) ] ) ) as Record<
        SkyKey,
        ReturnType< typeof numberControl >
    >;
}

export function TuningPanel() {
    useControls( 'Render', {
        dpr: numberControl( 'Render.dpr' ),
        device: { value: String( devicePixelRatio ), editable: false },
    } );

    useControls( 'Environment', {
        skyIntensity: numberControl( 'Env.skyIntensity' ),
        fillColor: colorControl( 'Env.fillColor' ),
        fillIntensity: numberControl( 'Env.fillIntensity' ),
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
        lift: numberControl( 'RailLight.lift' ),
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

    useControls( 'Ship', {
        envMapIntensity: numberControl( 'Ship.envMapIntensity' ),
    } );

    useControls( 'Hover', {
        base: numberControl( 'Hover.base' ),
        speedLift: numberControl( 'Hover.speedLift' ),
        follow: numberControl( 'Hover.follow' ),
        bob: numberControl( 'Hover.bob' ),
        bobRate: numberControl( 'Hover.bobRate' ),
    } );

    useControls( 'Seeker', {
        flyY: numberControl( 'Seeker.flyY' ),
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

    const [ , setSky ] = useControls( 'Sky', () => ( {
        Nebula: button( () => setSky( NEBULA_PRESET ) ),
        'Deep Space': button( () => setSky( DEEP_SPACE_PRESET ) ),
        ...skyControls(),
    } ) );

    useControls( 'Rock', {
        color: colorControl( 'Rock.color' ),
        textureScale: numberControl( 'Rock.textureScale' ),
        normalScale: numberControl( 'Rock.normalScale' ),
        roughness: numberControl( 'Rock.roughness' ),
        detail: numberControl( 'Rock.detail' ),
        spin: numberControl( 'Rock.spin' ),
        drift: numberControl( 'Rock.drift' ),
    } );

    return null;
}

export default TuningPanel;
