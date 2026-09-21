import { Fragment } from 'react';
import { ColdKey } from './cold-key';
import { CorridorLight } from './corridor-light';

export function SceneLighting() {
    return (
        <Fragment>
            <CorridorLight />
            <ColdKey />
        </Fragment>
    );
}
