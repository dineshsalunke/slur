export const simFreeze = { on: false };

export function attachFreezeToggle(): () => void {
    const onKey = ( e: KeyboardEvent ) => {
        if ( e.code === 'KeyP' ) simFreeze.on = ! simFreeze.on;
    };
    addEventListener( 'keydown', onKey );
    return () => removeEventListener( 'keydown', onKey );
}
