import { Fragment, Suspense, useMemo } from 'react';
import { LandingCover } from '../landing-reveal/landing-cover';
import { createReveal } from '../landing-reveal/landing-reveal.utils';
import { LazyLandingScene } from './landing-backdrop.constants';

export function LiveBackdrop() {
    const reveal = useMemo( createReveal, [] );
    return (
        <Fragment>
            <Suspense fallback={ null }>
                <LazyLandingScene reveal={ reveal } />
            </Suspense>
            <LandingCover reveal={ reveal } />
        </Fragment>
    );
}
