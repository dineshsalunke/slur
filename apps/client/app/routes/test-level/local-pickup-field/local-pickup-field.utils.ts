import { localCombat } from '../local-combat';

export function isTaken( id: string ): boolean {
    return localCombat.taken.get( id ) === true;
}
