import { lazy } from 'react';

export const LazyLandingScene = lazy( () =>
    import( '../landing-scene/landing-scene' ).then( ( m ) => ( { default: m.LandingScene } ) ),
);
