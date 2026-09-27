import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { attachResetKeys } from '../test-level-dev/test-level-dev.utils';

export function useResetKeys( room: LoopbackRoom ): void {
    const navigate = useNavigate();

    // Syncs with the browser keyboard: Backspace resets the loopback run, Shift+Backspace also clears ?start.
    useEffect( () => attachResetKeys( room, navigate ), [ room, navigate ] );
}
