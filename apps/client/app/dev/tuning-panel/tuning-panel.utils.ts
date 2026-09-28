import { syncAccent } from '../../game/scene/accent';
import { hdriLink, showHdri } from '../../game/scene/hdri/hdri.state';
import { TONE_MODE_OPTIONS } from '../../game/scene/tone-mapping';
import { col, num, setCol, setNum } from '../tuning';
import { type ColorPath, NUMBER_TUNABLES, type NumberPath } from '../tuning-schema';

export function numberControl( path: NumberPath ) {
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

export function colorControl( path: ColorPath ) {
    return {
        value: col( path ),
        onChange: ( value: string ) => setCol( path, value ),
        transient: true as const,
    };
}

export function accentControl() {
    return {
        value: col( 'Accent.color' ),
        onChange: ( value: string ) => {
            setCol( 'Accent.color', value );
            syncAccent();
            document.documentElement.style.setProperty( '--color-marigold', value );
        },
        transient: true as const,
    };
}

export function copyAccent(): void {
    const value = col( 'Accent.color' );
    console.log( value );
    void navigator.clipboard?.writeText( value );
}

export function hdriLinkControl() {
    return {
        value: hdriLink(),
        onChange: ( value: string ) => {
            void showHdri( value );
        },
        transient: true as const,
    };
}

export function toneModeControl() {
    return {
        value: num( 'ToneMapping.mode' ),
        options: TONE_MODE_OPTIONS,
        onChange: ( value: number ) => setNum( 'ToneMapping.mode', value ),
        transient: true as const,
    };
}
