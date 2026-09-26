import { SeekerBodies } from '../../../game/scene/seeker-bodies';
import { collect } from './local-seeker-field.state';

export function LocalSeekerField() {
    return <SeekerBodies collect={ collect } />;
}
