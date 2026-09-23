import { useActionData, useNavigation } from 'react-router';
import type { clientAction } from '../home';

export function MenuError() {
    const data = useActionData< typeof clientAction >();
    const idle = useNavigation().state === 'idle';
    const error = idle && data && 'error' in data ? data.error : null;

    return (
        <p role="alert" className="m-0 mt-3 text-[14px] text-readout empty:hidden">
            { error }
        </p>
    );
}
