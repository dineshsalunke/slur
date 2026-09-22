import { bumpRebuild } from './tuning-rebuild';
import { COLOR_TUNABLES, type ColorPath, NUMBER_TUNABLES, type NumberPath } from './tuning-schema';

const numbers = Object.fromEntries(
    Object.entries( NUMBER_TUNABLES ).map( ( [ path, spec ] ) => [ path, spec.value ] ),
) as Record< NumberPath, number >;

const colors = Object.fromEntries(
    Object.entries( COLOR_TUNABLES ).map( ( [ path, spec ] ) => [ path, spec.value ] ),
) as Record< ColorPath, string >;

export function num( path: NumberPath ): number {
    return numbers[ path ];
}

export function col( path: ColorPath ): string {
    return colors[ path ];
}

export function setNum( path: NumberPath, value: number ): void {
    numbers[ path ] = value;
    if ( NUMBER_TUNABLES[ path ].rebuild ) bumpRebuild();
}

export function setCol( path: ColorPath, value: string ): void {
    colors[ path ] = value;
    if ( COLOR_TUNABLES[ path ].rebuild ) bumpRebuild();
}
