import type { SeekerSink } from '../../../game/scene/seeker-bodies';
import { makeSeekerTrail, type SeekerTrailRing } from '../../../game/scene/seeker-trail';
import { localCombat } from '../local-combat';

const trails = new Map< string, SeekerTrailRing >();

export function collect( sink: SeekerSink ): void {
    for ( const id of trails.keys() ) if ( ! localCombat.seekers.has( id ) ) trails.delete( id );
    for ( const [ id, s ] of localCombat.seekers ) {
        let trail = trails.get( id );
        if ( ! trail ) {
            trail = makeSeekerTrail();
            trails.set( id, trail );
        }
        sink( s.x, s.y, s.z, trail );
    }
}
