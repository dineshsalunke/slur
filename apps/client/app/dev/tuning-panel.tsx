import { button, useControls } from 'leva';
import { DEFAULT_HDRI_SLUG, ENV_MODES, envMode, HDRI_SLUGS, setEnvMode, setHdriSlug } from './env-store';
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
    useControls( 'Environment', {
        source: {
            value: envMode(),
            options: [ ...ENV_MODES ],
            onChange: setEnvMode,
            transient: true as const,
        },
        skyColor: colorControl( 'Env.skyColor' ),
        skyIntensity: numberControl( 'Env.skyIntensity' ),
        groundColor: colorControl( 'Env.groundColor' ),
        groundIntensity: numberControl( 'Env.groundIntensity' ),
        bandColor: colorControl( 'Env.bandColor' ),
        bandIntensity: numberControl( 'Env.bandIntensity' ),
        bandHeight: numberControl( 'Env.bandHeight' ),
        hdri: {
            value: DEFAULT_HDRI_SLUG,
            options: [ ...HDRI_SLUGS ],
            onChange: setHdriSlug,
            transient: true as const,
        },
        slug: {
            value: '',
            onChange: ( value: string ) => {
                if ( value.trim() ) setHdriSlug( value );
            },
            transient: true as const,
        },
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

    useControls( 'Deck', {
        metalness: numberControl( 'Deck.metalness' ),
        roughness: numberControl( 'Deck.roughness' ),
        envMapIntensity: numberControl( 'Deck.envMapIntensity' ),
        normalScale: numberControl( 'Deck.normalScale' ),
        plate: numberControl( 'Deck.plate' ),
        plateColor: colorControl( 'Deck.plateColor' ),
        seamEmissive: numberControl( 'Deck.seamEmissive' ),
    } );

    useControls( 'Rail', {
        metalness: numberControl( 'Rail.metalness' ),
        roughness: numberControl( 'Rail.roughness' ),
        envMapIntensity: numberControl( 'Rail.envMapIntensity' ),
        normalScale: numberControl( 'Rail.normalScale' ),
        plate: numberControl( 'Rail.plate' ),
        plateColor: colorControl( 'Rail.plateColor' ),
        railEmissive: numberControl( 'Rail.railEmissive' ),
        rimEmissive: numberControl( 'Rail.rimEmissive' ),
    } );

    useControls( 'Monolith', {
        metalness: numberControl( 'Monolith.metalness' ),
        roughness: numberControl( 'Monolith.roughness' ),
        envMapIntensity: numberControl( 'Monolith.envMapIntensity' ),
        plate: numberControl( 'Monolith.plate' ),
        plateColor: colorControl( 'Monolith.plateColor' ),
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

    return null;
}

export default TuningPanel;
