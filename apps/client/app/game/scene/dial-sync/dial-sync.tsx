import { FrameSchedule } from '../../frame/frame-schedule/frame-schedule';
import { DIAL_SYNC_SCHEDULE } from './dial-sync.constants';

export function DialSync() {
    return <FrameSchedule schedule={ DIAL_SYNC_SCHEDULE } context={ null } />;
}
