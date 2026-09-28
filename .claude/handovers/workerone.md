Agent: workerone · Lane: #352 backdrop image + Poly Haven HDRI (DONE, closed) · #349 RFC (awaiting owner) · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#352: the sky is an image, the env is a Poly Haven HDRI from a dev-panel link; key light, near fill,
procedural sky and the Tuning folder removed.

## Done

- #352 `90a2699` (pushed, issue closed). ADR-030, ART_MATERIALS rev 10 / §7 item 22, ADD §sky rewritten.
- #349 RFC complete earlier (`77d7df6`); awaiting owner §8 Q1–Q10.

## State

- Verified this session (headless Chrome, DPR 1, /test-level): backdrop jpg + default .hdr load; pasted
  `polyhaven.com/a/kloppenheim_06` fetches the 2k file (high tier), status reads `kloppenheim_06_2k.hdr`;
  a bad slug 404s and shows an error; an empty field reloads the default.
- Verified: api.polyhaven.com and dl.polyhaven.org both send `access-control-allow-origin: *`.
- typecheck, client tests (92 files / 640), lint: pass.
- Track luma with the HDRI only [unmeasured]; owner tunes `Environment.intensity`.

## Uncommitted

- none.

## Held files

- `docs/RFC-349-ARCHITECTURE.md`. #352 files released.

## Next

1. Owner verifies #352 on /test-level (brief sent to supervisor).
2. #349: fold owner answers to §8 Q1–Q10.
3. #345: close after owner sign-off. After deploy: prod /metrics, then close #337/#339.

## Open questions

- Owner: RFC §8 Q1–Q10.
- Owner: the marigold band reflection on blocks/monoliths/ships went with the baked env. Want it back?

## Lessons → memory

- none this seam.
