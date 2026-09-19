# Golden reference — complete session archive

**Final approved image:** [17_golden_reference_FINAL.png](../../boards/17_golden_reference_FINAL.png).

This archive retains all 15 images generated in this conversation, all 15 successful generation/edit prompts, original user attachments and the accumulated briefs/reviews. Images already in `boards/` are linked rather than duplicated here. The final copy is byte-identical to draft 17. No unsuccessful version has been overwritten. Source files, exact prompts and checksums are local to the repository; reproducing a prompt does not guarantee an identical stochastic image.

## Image and prompt lineage

| Step | Image | Exact prompt | Parent / purpose |
|---|---|---|---|
| 01 | [First proposal](nebula-candidate-01.png) | [Prompt](PROMPT.txt) | Original concept + marigold scene + pickup sheet |
| 02 | [Material/scale revision](nebula-candidate-02.png) | [Prompt](REVISION-PROMPT.txt) | 01; quieter deck, smaller craft |
| 03 | [Glow](nebula-candidate-03-glow.png) | [Prompt](GLOW-PROMPT.txt) | 02; stronger local glow |
| 04 | [Tile lights](nebula-candidate-04-tiles.png) | [Prompt](TILE-PROMPT.txt) | 03 + user's prior proposal |
| 05 | [Irregular seams](nebula-candidate-05-irregular-seams.png) | [Prompt](IRREGULAR-SEAMS-PROMPT.txt) | 04; varied inserts, restored monolith glow |
| 06 | [Action](nebula-candidate-06-action.png) | [Prompt](ACTION-PROMPT.txt) | 05; two gaps, opponent, Seeker |
| 07 | [Stepped gaps](nebula-candidate-07-stepped-gaps.png) | [Prompt](STEPPED-GAPS-PROMPT.txt) | 06 + original gap board |
| 08 | [Boost exhaust](nebula-candidate-08-boost-exhaust.png) | [Prompt](BOOST-EXHAUST-PROMPT.txt) | 07; strong thrust |
| 09 | [Strong blur](nebula-candidate-09-boost-motion-blur.png) | [Prompt](MOTION-BLUR-PROMPT.txt) | 08; cinematic blur, subsequently reduced |
| 10 | [Reduced blur](nebula-candidate-10-reduced-blur.png) | [Prompt](SUBTLE-BLUR-PROMPT.txt) | 09 |
| 11 | [Boxed HUD](nebula-candidate-11-hud.png) | [Prompt](HUD-PROMPT.txt) | 10; rejected oversized UI |
| 12 | [Borderless HUD](nebula-candidate-12-borderless-hud.png) | [Prompt](BORDERLESS-HUD-PROMPT.txt) | 11; approved composition, later colour correction |
| 15 board | [Intensity proposal](../../boards/15_environment_intensity_proposal.png) | [Prompt](../../boards/15_environment_intensity_PROMPT.txt) | 12/board14 + original intensity board; not approved |
| 16 board | [Desaturated draft](../../boards/16_golden_reference_desaturated_DRAFT.png) | [Prompt](../../boards/16_golden_reference_PROMPT.txt) | 12/board14; deeper darks, became too neutral grey |
| 17 board | [Cold-undertone draft](../../boards/17_golden_reference_cold_undertone_DRAFT.png) / [FINAL](../../boards/17_golden_reference_FINAL.png) | [Prompt](../../boards/17_golden_reference_PROMPT.txt) | 16; faint cold tint and tile refinement; FINAL approved |

Board 14 is an unchanged promoted copy of candidate 12, not another generation. Numbers distinguish exploration candidates from board identifiers. One tile-edit attempt hit a usage limit; its intended brief is retained in CANDIDATE-04-TILE-BRIEF.md. It produced no missing image.

## Source evidence

- [User's previous-chat proposal](source-inputs/user-prior-proposal.png): reference for tiles and intermittent seam glow.
- [Original pasted Claude material report](source-inputs/claude-material-report-original.txt): historical proposal, not overriding later user decisions.
- Original source images remain in [boards](../../boards/README.md): 00/13 original mood, 12 marigold integration, 11 pickup family, 08 gap variations, 02 environment intensity. The extracted [handoff](../../handoff/HANDOVER.md) and [engineering feedback](../../source/CLAUDE_ENGINEERING_FEEDBACK_2026-09-17.md) remain in place.
- [Current decision record](../../GOLDEN_REFERENCE.md), [board rebuild plan](../../BOARD_REBUILD_PLAN.md), [initial brief](BRIEF.md), [HUD exploration](HUD-EXPLORATION.md), candidate reviews, and board 15/16/17 companion reviews preserve rationale and known inaccuracies.

## Key decisions recovered from the conversation

Nebula baseline; distinguish coated gameplay metal from stone scenery; 4u tiles are an art ruler not gameplay lanes; large pickups aid distance recognition; irregular interior inserts and visible monolith seams; stepped open-floor gaps with attached floor; supported straight outer boundary; boost uses subtle environmental blur; pursuit adds opponent and square four-fin Seeker; five nearby standings, not full roster; borderless small floating HUD; deep dark materials rather than excessive light; low-saturation cold undertone rather than vivid blue or pure greyscale.

This is a production archive and decision summary, not a verbatim transcript of the earlier unavailable chat. Retained generated errors never override dimensions or frozen family designs. See `ARCHIVE_SHA256.txt` for checksums of archived files and `GENERATED_IMAGE_MANIFEST.json` for original generation-file mapping and byte-match verification.
