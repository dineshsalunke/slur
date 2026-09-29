import { scheduleSystems } from '../frame/schedule';
import {
    type NetFrame,
    netCamera,
    netDeathVfx,
    netFinishCurtain,
    netFlight,
    netHover,
    netRemoteInterp,
    netRenderInterp,
} from './net-loop.utils';

export const NET_SCHEDULE = scheduleSystems< NetFrame >( 'net', [
    { id: 'net.flight', phase: 'simulate', run: netFlight },
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
] );
