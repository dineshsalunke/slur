import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { rockFor } from './meteor-rock.state';
import type { MeteorRock } from './meteor-rock.utils';

export function useMeteorRock(): MeteorRock {
    return rockFor( useRebuildToken() );
}
