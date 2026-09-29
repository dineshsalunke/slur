import { FEATURE_SYSTEMS } from '../../engine/active-features';
import { scheduleSystems } from '../frame/schedule';
import { writeHud } from '../hud/hud-writers/hud-writers.state';
import { GAMEPAD_SYSTEM } from '../input/gamepad';
import {
    type NetFrame,
    netCamera,
    netDeathVfx,
    netFinishCurtain,
    netFlight,
    netHostTick,
    netHover,
    netRemoteInterp,
    netRenderInterp,
    netSendInput,
} from './net-loop.utils';

export const NET_SCHEDULE = scheduleSystems< NetFrame >( 'net', [
    GAMEPAD_SYSTEM,
    { id: 'net.host-tick', phase: 'simulate', before: [ 'net.flight' ], run: netHostTick },
    { id: 'net.flight', phase: 'simulate', run: netFlight },
    { id: 'net.send-input', phase: 'simulate', after: [ 'net.flight' ], run: netSendInput },
    { id: 'net.render-interp', phase: 'sync', run: netRenderInterp },
    { id: 'net.remote-interp', phase: 'sync', run: netRemoteInterp },
    { id: 'net.hover', phase: 'sync', after: [ 'net.render-interp', 'net.remote-interp' ], run: netHover },
    { id: 'net.death-vfx', phase: 'sync', run: netDeathVfx },
    { id: 'net.finish-curtain', phase: 'sync', run: netFinishCurtain },
    {
        id: 'net.camera',
        phase: 'sync',
        after: [ 'net.hover', 'net.death-vfx', 'net.finish-curtain' ],
        run: netCamera,
    },
    { id: 'net.hud', phase: 'cleanup', run: writeHud },
    ...FEATURE_SYSTEMS,
] );
