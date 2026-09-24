import { Fragment } from 'react';
import type { PointChunk } from './board-scale';

interface PolylineChunksProps {
    chunks: PointChunk[];
    className: string;
    stroke?: boolean;
}

export function PolylineChunks( { chunks, className, stroke = true }: PolylineChunksProps ) {
    return (
        <Fragment>
            { chunks.map( ( c ) => (
                <polyline
                    key={ c.at }
                    points={ c.points }
                    vectorEffect={ stroke ? 'non-scaling-stroke' : undefined }
                    className={ className }
                />
            ) ) }
        </Fragment>
    );
}
