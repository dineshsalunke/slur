import { HOME_SCREEN_HINT_KEY } from '../fullscreen.constants';

export interface HomeScreenEnv {
    standalone: boolean | undefined;
    fullscreenEnabled: boolean;
    displayStandalone: boolean;
    dismissed: boolean;
}

export function needsHomeScreenHint( env: HomeScreenEnv ): boolean {
    if ( env.standalone === undefined || env.fullscreenEnabled || env.dismissed ) return false;
    return ! env.standalone && ! env.displayStandalone;
}

function hintDismissed(): boolean {
    try {
        return localStorage.getItem( HOME_SCREEN_HINT_KEY ) === 'dismissed';
    } catch {
        return false;
    }
}

export function homeScreenHintDue(): boolean {
    return needsHomeScreenHint( {
        standalone: ( navigator as Navigator & { standalone?: boolean } ).standalone,
        fullscreenEnabled: document.fullscreenEnabled === true,
        displayStandalone: matchMedia( '(display-mode: standalone)' ).matches,
        dismissed: hintDismissed(),
    } );
}

export function dismissHomeScreenHint(): void {
    try {
        localStorage.setItem( HOME_SCREEN_HINT_KEY, 'dismissed' );
    } catch {}
}
