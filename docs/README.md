# SLUR — Design Docs

> Working title: **SLUR**. Casual multiplayer ship-racer — play it on the office **LAN** or **hosted on the web** — a party game about *messing with your friends*.
> Player-flown, finite Race-to-finish. SkyRoads (1993) speed/jump × Blur (2010) pickup-combat × [cuberun](https://github.com/akarlsten/cuberun) neon.

For current art, start with the [final subject folders](art-direction/README.md). Their final briefs govern appearance. Gameplay and technical documents describe their own contracts; historical proposals and open questions do not override finalized art.

## The documents

| Doc | Scope | Owner question it answers |
|-----|-------|---------------------------|
| [GDD.md](./GDD.md) | Game Design | *What is the game and why is it fun?* |
| [TDD.md](./TDD.md) | Technical Design | *How is it built?* |
| [ADD.md](./ADD.md) | Art Design | *What does it look like?* |
| [AUDIO.md](./AUDIO.md) | Audio / Sound Design | *What does it sound like?* |

## Relationship to `conventions/`

`docs/` = **what we're building** (product/design decisions, project-specific).
`../conventions/` = **how we build with the stack** (framework idioms, best practices, anti-patterns — mostly stack-general).

The TDD references `conventions/*` rather than duplicating them.

## Reading order

New to the project? Read **GDD → ADD → AUDIO → TDD**. Design before implementation.
