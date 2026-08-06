# SLUR — Design Docs

> Working title: **SLUR**. Casual LAN multiplayer ship-racer for the office — a party game about *messing with your friends*.
> Player-flown, two modes (Race-to-finish / endless Survival). SkyRoads (1993) speed/jump × Blur (2010) pickup-combat × [cuberun](https://github.com/akarlsten/cuberun) neon.

These are **living documents**. Each starts as a v0 draft and carries an `OPEN QUESTIONS` section — resolve those with the team, then fold the decision into the body and delete the question.

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
