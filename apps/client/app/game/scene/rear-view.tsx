import { useRearViewShown } from '../../dev/rear-view-toggle';
import { RearViewPass } from './rear-view-pass/rear-view-pass';

export function RearView() {
    if ( ! useRearViewShown() ) return null;

    return <RearViewPass />;
}
