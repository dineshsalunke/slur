import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { attachFreezeToggle } from '../../../dev/sim-freeze';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { attachClassKeys, stepAutoRestart } from './test-level-dev.utils';

export function TestLevelDev( { room }: { room: LoopbackRoom } ) {
    const world = useWorld();

    // Syncs with the browser keyboard: KeyP toggles the sim freeze.
    useEffect( attachFreezeToggle, [] );

    // Syncs with the browser keyboard: Shift+1-5 restarts the loopback run with that ship class.
    useEffect( () => attachClassKeys( room ), [ room ] );

    useFrame( () => stepAutoRestart( room, world ) );

    return null;
}
