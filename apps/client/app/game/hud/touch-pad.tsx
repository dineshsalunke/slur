import { TouchButton } from './touch-button/touch-button';

export function TouchPad() {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[24] hidden items-end justify-between pr-[max(20px,env(safe-area-inset-right))] pb-[calc(84px+env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] pointer-coarse:flex">
            <div className="flex items-end gap-3">
                <TouchButton name="Steer left" label="◀" control="left" className="size-20 text-[20px]" />
                <TouchButton name="Steer right" label="▶" control="right" className="size-20 text-[20px]" />
            </div>
            <div className="grid grid-cols-2 items-end justify-items-center gap-3">
                <div className="flex flex-col items-center gap-3">
                    <TouchButton name="Fire power-up back" label="Back" code="KeyF" className="size-12" />
                    <TouchButton name="Use power-up" label="Fire" code="KeyE" className="size-16" />
                </div>
                <TouchButton name="Jump" label="Jump" control="jump" className="size-20" />
                <TouchButton name="Brake" label="Brake" control="brake" className="size-16" />
                <TouchButton name="Throttle" label="Thrust" control="throttle" className="size-24 border-marigold/60" />
            </div>
        </div>
    );
}
