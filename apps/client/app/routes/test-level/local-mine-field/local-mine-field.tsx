import { MineBodies } from '../../../game/scene/mine-bodies';
import { collect } from './local-mine-field.utils';

export function LocalMineField() {
    return <MineBodies collect={ collect } />;
}
