import { Fragment } from 'react';
import { ColdKey } from './cold-key';

export const AMBIENT_INTENSITY = 0;

export function SceneLighting() {
    return (
        <Fragment>
            <ambientLight intensity={ AMBIENT_INTENSITY } />
            <ColdKey />
        </Fragment>
    );
}
