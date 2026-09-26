import { BoltStreaks } from '../../../game/scene/bolt-streaks/bolt-streaks';
import { collect } from './local-bolt-field.utils';

export function LocalBoltField() {
    return <BoltStreaks collect={ collect } />;
}
