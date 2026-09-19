import { useSyncExternalStore } from 'react';
import {
    SKY_TUNING,
    type SkyTuningNumber,
    skyTuningVersion,
    subscribeSkyTuning,
    writeSkyTuning,
} from '../iso-sky/sky-tuning';

// The framing knobs only. `/iso-sky` keeps the full set (grading, the rig, the light self-test) because it is
// the isolation lab; framing is the one judgement that CANNOT be made there, since it depends on the chase
// camera and on having a track in frame.
const SLIDERS: readonly { key: SkyTuningNumber; label: string; min: number; max: number; step: number }[] = [
    { key: 'backdropBearingDeg', label: 'pan', min: -90, max: 90, step: 1 },
    { key: 'backdropElevationDeg', label: 'tilt', min: -40, max: 40, step: 1 },
    // Floor 43, not a round number: below fovDeg/aspect ≤ 2·edgeFadeDeg (42.6° at the committed 12°) the
    // alpha fade meets itself and the patch can never reach full opacity. Moves if edgeFadeDeg does.
    { key: 'fovDeg', label: 'fov', min: 43, max: 200, step: 1 },
];

/**
 * Sky framing sliders, reading the SAME `SKY_TUNING` singleton `/iso-sky` writes — deliberately not a second
 * tuning surface, so the two labs cannot disagree about what ships.
 *
 * Its own component because it holds its own subscription: kept in `ArtLabControls` this would re-render the
 * whole panel on every drag tick (non-negotiable #10 — push the subscription down to the leaf that reads it).
 *
 * Pan also moves `starBearingDeg`; see `writeSkyTuning`. The readout shows it so a frozen Pan value is never
 * transcribed without its star.
 */
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
