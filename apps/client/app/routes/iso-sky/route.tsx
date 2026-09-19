import { Fragment } from 'react';
import { IsoLab } from '../../iso-lab/iso-lab';
import { RoughnessProbes } from './roughness-probes';
import { SkyTuningPanel } from './sky-tuning-panel';
import { TunableSky } from './tunable-sky';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Sky' } ];
}

/**
 * `/iso-sky` — the deep-space background in isolation, with the roughness self-test in frame.
 *
 * `rig={false}` turns OFF the lab's neutral ambient+directional pair. Every other ingredient wants that rig;
 * this one is the only ingredient that IS the lighting, and a neutral directional light would put a tight
 * highlight on the smooth probe and a broad one on the rough probe all by itself — making the falsifiable test
 * pass whether or not the sky lights anything. The rig stays one click away in the panel for sanity checks.
 */
export default function IsoSkyRoute() {
    return (
        <Fragment>
            { /* Defaults to the UNOCCLUDED backdrop, not board 12. 12 is that same sky with rock painted over
                 it, so judging an isolated dome against it reads occlusion as intended faintness — that is
                 exactly what failed the slice-1 gate. */ }
            <IsoLab title="Deep-space sky" size={ 160 } board="nebula-backdrop.jpg" rig={ false }>
                <TunableSky />
                <RoughnessProbes radius={ 22 } />
            </IsoLab>
            { /* A DOM sibling, not an IsoLab prop — the shared instrument stays free of one ingredient's knobs. */ }
            <SkyTuningPanel />
        </Fragment>
    );
}
