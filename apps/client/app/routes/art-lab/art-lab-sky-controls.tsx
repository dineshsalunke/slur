import { useSyncExternalStore } from 'react';
import {
    SKY_TUNING,
    type SkyTuningNumber,
    skyTuningVersion,
    subscribeSkyTuning,
    writeSkyTuning,
} from '../iso-sky/sky-tuning';

const SLIDERS: readonly { key: SkyTuningNumber; label: string; min: number; max: number; step: number }[] = [
    { key: 'backdropBearingDeg', label: 'pan', min: -90, max: 90, step: 1 },
    { key: 'backdropElevationDeg', label: 'tilt', min: -40, max: 40, step: 1 },
    { key: 'fovDeg', label: 'fov', min: 43, max: 200, step: 1 },
];

export function ArtLabSkyControls() {
    useSyncExternalStore( subscribeSkyTuning, skyTuningVersion, skyTuningVersion );

    return (
        <div className="mb-2">
            { SLIDERS.map( ( s ) => (
                <div key={ s.key } className="mb-1 flex items-center gap-2">
                    <span className="w-8 shrink-0 font-mono text-[10px] text-white/40">{ s.label }</span>
                    <input
                        type="range"
                        min={ s.min }
                        max={ s.max }
                        step={ s.step }
                        value={ SKY_TUNING[ s.key ] }
                        onChange={ ( e ) => writeSkyTuning( s.key, Number( e.target.value ) ) }
                        className="h-1 w-full accent-amber-400"
                    />
                    <span className="w-8 shrink-0 text-right font-mono text-[10px] text-white/70">
                        { SKY_TUNING[ s.key ] }
                    </span>
                </div>
            ) ) }
            <div className="font-mono text-[10px] text-white/40">
                star bearing { SKY_TUNING.starBearingDeg }° — follows pan
            </div>
        </div>
    );
}
