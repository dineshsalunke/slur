import { HeldPower } from '@slur/shared';
import { useQueryFirst, useTrait } from 'koota/react';
import { Fragment } from 'react';
import { Held, LocalPlayer } from '../../ecs/traits';
import { useSelectedSlot } from '../../input/power-select';
import { BOOST_LEAD, BOOST_TRAIL, MINE_STAR, SHIELD_HEX } from './power-gem.constants';

export function PowerGem() {
    const ship = useQueryFirst( LocalPlayer );
    const held = useTrait( ship, Held );
    const slot = useSelectedSlot();
    const power = held?.slots[ slot ] ?? HeldPower.none;
    return (
        <svg
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
            className={ `h-[clamp(26px,4.6vh,46px)] w-[clamp(26px,4.6vh,46px)] shrink-0 drop-shadow-power-gem ${
                power === HeldPower.none ? 'opacity-40' : ''
            }` }
        >
            { power === HeldPower.seeker ? (
                <Fragment>
                    <rect
                        x="9"
                        y="9"
                        width="30"
                        height="30"
                        rx="5"
                        className="fill-void-2 stroke-marigold"
                        strokeWidth="1.6"
                    />
                    <circle cx="24" cy="24" r="8" className="fill-marigold" />
                    <circle cx="24" cy="24" r="4" className="fill-gold" />
                </Fragment>
            ) : power === HeldPower.boost ? (
                <Fragment>
                    <polygon points={ BOOST_LEAD } className="fill-void-2 stroke-marigold" strokeWidth="1.6" />
                    <polygon points={ BOOST_TRAIL } className="fill-void-2 stroke-marigold" strokeWidth="1.6" />
                    <polygon points="24,5 36,17 36,20 24,8 12,20 12,17" className="fill-gold" />
                    <polygon points="24,21 36,33 36,36 24,24 12,36 12,33" className="fill-marigold" />
                </Fragment>
            ) : power === HeldPower.shield ? (
                <Fragment>
                    <circle cx="24" cy="24" r="19" className="fill-void-2 stroke-marigold" strokeWidth="1.6" />
                    <circle cx="24" cy="24" r="13" className="fill-none stroke-marigold" strokeWidth="3" />
                    <polygon points={ SHIELD_HEX } className="fill-gold" />
                </Fragment>
            ) : power === HeldPower.mine ? (
                <Fragment>
                    <polygon points={ MINE_STAR } className="fill-void-2 stroke-marigold" strokeWidth="1.6" />
                    <circle cx="24" cy="24" r="6.5" className="fill-marigold" />
                    <circle cx="24" cy="24" r="3.2" className="fill-gold" />
                </Fragment>
            ) : (
                <Fragment>
                    <polygon
                        points="24,2 38,24 24,46 10,24"
                        className="fill-void-2 stroke-marigold"
                        strokeWidth="1.6"
                    />
                    <polygon points="24,2 31,24 24,46" className="fill-hud/10" />
                    <polygon points="24,12 31,24 24,36 17,24" className="fill-marigold" />
                    <polygon points="24,16 28,24 24,32" className="fill-gold" />
                </Fragment>
            ) }
        </svg>
    );
}
