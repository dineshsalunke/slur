import { Fragment, useMemo, useSyncExternalStore } from 'react';
import { DeepSpaceSky } from '../../game/scene/deep-space-sky';
import { SkyEnvironment } from '../../game/scene/sky-environment';
import { SKY_TUNING, skyTuningVersion, subscribeSkyTuning, tunedSkyConfig } from './sky-tuning';

/**
 * The real shipped sky, driven by the tuning panel — it renders the game's own components rather than a lab
 * copy, so what is being tuned here IS what ships.
 *
 * THE DISPLAY AND THE LIGHTING ARE MOUNTED SEPARATELY, and that is not decoration. `<Environment frames={1}>`
 * renders a cubemap; re-running it on every tick of a `fovDeg` drag would burn a bake per frame to produce a
 * byte-identical result. Two `useMemo`s split on which knobs each side actually reads, so a backdrop drag
 * leaves the environment's config identity untouched and its subtree never reconciles. `DeepSpaceSky` gets
 * `environment={false}` for the same reason — the `<SkyEnvironment>` below IS the shipped one, just hoisted
 * out of the re-rendering half.
 */
export function TunableSky( { backdrop = true }: { backdrop?: boolean } ) {
    useSyncExternalStore( subscribeSkyTuning, skyTuningVersion, skyTuningVersion );
    const t = SKY_TUNING;

    const display = useMemo(
        tunedSkyConfig,
        // The memo reads the singleton, so the deps ARE the knobs that must invalidate it — a whole-config
        // dep would defeat the split this exists for.
        [
            t.backdropBearingDeg,
            t.backdropElevationDeg,
            t.fovDeg,
            t.edgeFadeDeg,
            t.gain,
            t.starBearingDeg,
            t.starElevationDeg,
            t.lightIntensity,
            t.lightColor,
            t.starsOn,
        ],
    );

    const lighting = useMemo(
        tunedSkyConfig,
        // As above — only the rig's own knobs.
        [
            t.starBearingDeg,
            t.starElevationDeg,
            t.keyIntensity,
            t.keySizeDeg,
            t.keyColor,
            t.fillIntensity,
            t.fillColor,
            t.ambientIntensity,
            t.ambientColor,
        ],
    );

    return (
        <Fragment>
            <DeepSpaceSky
                config={ display }
                backdrop={ backdrop }
                light={ t.lightOn }
                environment={ false }
                toneMapped={ t.toneMapped }
            />
            { t.envOn ? <SkyEnvironment config={ lighting } /> : null }
        </Fragment>
    );
}
