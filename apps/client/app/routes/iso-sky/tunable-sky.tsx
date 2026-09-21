import { Fragment, useMemo, useSyncExternalStore } from 'react';
import { DeepSpaceSky } from '../../game/scene/deep-space-sky';
import { SkyEnvironment } from '../../game/scene/sky-environment';
import { SKY_TUNING, skyTuningVersion, subscribeSkyTuning, tunedSkyConfig } from './sky-tuning';

export function TunableSky( { backdrop = true }: { backdrop?: boolean } ) {
    useSyncExternalStore( subscribeSkyTuning, skyTuningVersion, skyTuningVersion );
    const t = SKY_TUNING;

    const display = useMemo( tunedSkyConfig, [
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
    ] );

    const lighting = useMemo( tunedSkyConfig, [
        t.starBearingDeg,
        t.starElevationDeg,
        t.keyIntensity,
        t.keySizeDeg,
        t.keyColor,
        t.fillIntensity,
        t.fillColor,
        t.ambientIntensity,
        t.ambientColor,
    ] );

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
