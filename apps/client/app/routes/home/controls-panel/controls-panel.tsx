import { KeyHint } from '../../../ui/key-hint';
import { TOUCH_CONTROLS } from './controls-panel.constants';
import { keyboardControls } from './controls-panel.utils';

export function ControlsPanel() {
    return (
        <aside
            aria-labelledby="controls"
            className="shrink-0 self-start border border-readout/15 bg-deep/60 px-4 py-3 md:w-60 md:self-end md:pointer-coarse:w-80 [@media(max-height:480px)]:hidden"
        >
            <h2 id="controls" className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-[0.3em] text-readout">
                Controls
            </h2>
            <KeyHint
                hints={ keyboardControls() }
                className="grid grid-cols-2 gap-x-5 gap-y-2 md:grid-cols-1 pointer-coarse:hidden"
            />
            <KeyHint hints={ TOUCH_CONTROLS } className="hidden gap-y-2 pointer-coarse:grid" />
        </aside>
    );
}
