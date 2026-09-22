import { useControls } from 'leva';
import { setCol, setNum } from './tuning';
import { COLOR_TUNABLES, type ColorPath, NUMBER_TUNABLES, type NumberPath } from './tuning-schema';

function numberControl( path: NumberPath ) {
    const spec = NUMBER_TUNABLES[ path ];
    return {
        value: spec.value,
        min: spec.min,
        max: spec.max,
        step: spec.step,
        onChange: ( value: number ) => setNum( path, value ),
        transient: true as const,
    };
}

function colorControl( path: ColorPath ) {
    const spec = COLOR_TUNABLES[ path ];
    return {
        value: spec.value,
        onChange: ( value: string ) => setCol( path, value ),
        transient: true as const,
    };
}

export function TuningPanel() {
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
