import { useNavigation } from 'react-router';
import { Button } from '../../ui/button';
import { Chevron } from '../../ui/chevron';

export function HostButton() {
    const navigation = useNavigation();
    const busy = navigation.state !== 'idle';
    const hosting = busy && ! navigation.formData?.get( 'join' );

    return (
        <Button disabled={ busy } className="w-full sm:w-auto">
            { hosting ? 'Hosting…' : 'Host' }
            <Chevron dir="right" />
        </Button>
    );
}
