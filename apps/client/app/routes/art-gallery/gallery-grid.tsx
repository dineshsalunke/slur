import { Grid } from '@react-three/drei';
import { Fragment } from 'react';
import { useShowGrid } from './art-gallery-store';

// Every cell is 1u, every heavy line 10u, so world scale is readable at a glance.
export function GalleryGrid() {
    if ( ! useShowGrid() ) return <Fragment />;

    return (
        <Grid
            args={ [ 400, 400 ] }
            cellSize={ 1 }
            cellThickness={ 0.5 }
            cellColor="#1b2530"
            sectionSize={ 10 }
            sectionThickness={ 1 }
            sectionColor="#2d4256"
            fadeDistance={ 400 }
            fadeStrength={ 1 }
            infiniteGrid
            position={ [ 0, -0.05, 0 ] }
        />
    );
}
