import { useActionData, useLoaderData, useNavigation } from 'react-router';
import type { clientAction, clientLoader } from '../home';

export function MenuError() {
    const data = useActionData< typeof clientAction >();
    const { notice } = useLoaderData< typeof clientLoader >();
    const idle = useNavigation().state === 'idle';
    const error = idle && data && 'error' in data ? data.error : data ? null : notice;

    return (
        <p role="alert" className="m-0 mt-3 text-[14px] text-readout empty:hidden">
            { error }
        </p>
    );
}
