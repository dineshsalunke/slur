import { Fragment } from 'react';
import { FillLights } from './fill-lights';
import { GradientIbl } from './gradient-ibl';

export function SceneLighting() {
    return (
        <Fragment>
            <GradientIbl />
            <FillLights />
        </Fragment>
    );
}
