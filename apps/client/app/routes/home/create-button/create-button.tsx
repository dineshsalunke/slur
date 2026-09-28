import { useNavigation } from 'react-router';
import { Button } from '../../../ui/button';
import { Chevron } from '../../../ui/chevron';
import { menuIntent } from '../menu-form.utils';
import { useEnterCreates } from './use-enter-creates';

export function CreateButton() {
    const navigation = useNavigation();
    const busy = navigation.state !== 'idle';
    const creating = busy && !! navigation.formData && menuIntent( navigation.formData.get( 'intent' ) ) === 'create';
    useEnterCreates();

    return (
        <Button name="intent" value="create" disabled={ busy } className="w-full sm:w-auto">
            { creating ? 'Creating…' : 'Create room' }
            <Chevron dir="right" />
        </Button>
    );
}
