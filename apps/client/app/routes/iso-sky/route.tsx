import { Fragment } from 'react';
import { IsoLab } from '../../iso-lab/iso-lab';
import { RoughnessProbes } from './roughness-probes';
import { SkyTuningPanel } from './sky-tuning-panel';
import { TunableSky } from './tunable-sky';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Sky' } ];
}

export default function IsoSkyRoute() {
    return (
        <Fragment>
            <IsoLab title="Deep-space sky" size={ 160 } board="nebula-backdrop.jpg" rig={ false }>
                <TunableSky />
                <RoughnessProbes radius={ 22 } />
            </IsoLab>
            <SkyTuningPanel />
        </Fragment>
    );
}
