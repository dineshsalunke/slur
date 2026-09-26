import {
    authoredLevel,
    isLevelSlug,
    parseAuthoredLevel,
    registerAuthoredLevel,
    START_MESSAGE,
    type TrackDescriptor,
} from '@slur/shared';
import { simFreeze } from '../../dev/sim-freeze';
import { finishWatch, resetFinishWatch } from '../../game/finish/finish-watch';
import { LoopbackRoom } from '../../net/loopback-room/loopback-room';
import { editorOpen } from './test-level-canvas/pause-while-editing/pause-while-editing.state';
import { testLevelDescriptor } from './test-level-canvas/test-level-canvas.utils';
import { autoRestart } from './test-level-dev/test-level-dev.state';
import { tunedSimConfig } from './tuned-sim-config';

let stopCurrent: ( () => void ) | null = null;

export async function testLevelDescriptorFor( params: URLSearchParams ): Promise< TrackDescriptor > {
    const level = params.get( 'level' );
    if ( ! isLevelSlug( level ) ) return testLevelDescriptor( params.get( 'gen' ) );
    if ( authoredLevel( level ) === undefined ) {
        const res = await fetch( `/__tracks/${ level }` );
        if ( ! res.ok ) throw new Error( `track ${ level }: ${ res.status } ${ await res.text() }` );
        registerAuthoredLevel( parseAuthoredLevel( await res.json() ) );
    }
    return { kind: 'authored', levelId: level };
}

export function openTestLevelRoom( descriptor: TrackDescriptor ): LoopbackRoom {
    stopCurrent?.();
    autoRestart.pending = false;
    resetFinishWatch( finishWatch );
    const room = new LoopbackRoom( descriptor, {
        name: 'You',
        countdownSeconds: 0,
        config: tunedSimConfig(),
    } );
    room.send( START_MESSAGE );
    stopCurrent = room.run( () => simFreeze.on || editorOpen.on );
    return room;
}
