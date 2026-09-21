# SLUR — selected artwork

This is the image set confirmed by the owner on 2026-09-20. Start here for current art references. Folder and file names describe their subjects rather than generation numbers or draft labels.

| Subject | Selected images | How to use them |
|---|---|---|
| Golden reference | [Approved action lighting](golden-reference/action-lighting.png) · [Approved cruise lighting](golden-reference/cruise-lighting.png) · [Original scene](golden-reference/scene-and-hud.png) | Action image preserves approved detailed deck wear and action lighting. Reconcile hue and tonal balance against the newly approved background board; cruise HUD accents still need matching. Original scene is retained for comparison. |
| Background | [Approved direction](background/approved-direction.png) · [Earlier celestial hierarchy](background/celestial-hierarchy.png) | Approved planet-led and nebula-led environments; hue and tonal balance govern subsequent reconciliation. [Scope](background/DIRECTION.md). |
| Track | [Approved detailed deck](golden-reference/action-lighting.png) · [Flush-border rails](track/flush-border-rails.png) · [Surface wear](track/surface-wear.png) · [Material baseline](track/material-baseline.png) | The owner’s explicit attachment governs deck detail and wear. The featureless clean diagnostic was not selected. Subject boards await reconciliation. |
| Ingredients — Blocks — Non-destructible | [Surface details](ingredients/blocks/non-destructible/surface-details.png) · [V1 context](ingredients/blocks/non-destructible/v1-context.png) | Surface details govern the current non-destructible finish. V1 is historical context only: its destructible family, tall/stacked examples and superseded forms are not current non-destructible construction instructions. |
| Vehicles — Comet | [Concept sheet](vehicles/comet/concept-sheet.png) | Selected developed concept artwork. |
| Vehicles — Split Crown | [Concept sheet](vehicles/split-crown/concept-sheet.png) · [Approved material study](vehicles/split-crown/material-study.png) | Selected design and dark coated-metal finish. Scene integration and exhaust remain unresolved. |
| Progression | [Approved elevated camera](progression/camera-elevated.png) · [Overview](progression/overview.png) · [Calm](progression/calm.png) · [Balanced](progression/balanced.png) · [Intense](progression/intense.png) | Use [approved framing](progression/CAMERA.md) in individual 16:9 scene proposals. Monolith Corridor and Rock Enclosure selected; progression revisions pending. |

18 images total, including the approved elevated camera, background direction, cruise/action lighting companions and Split Crown material study. The background board governs the newly approved hue and tonal balance; golden-reference colour reconciliation remains pending. Selection confirms the artwork set; generated dimensions and incidental details do not override gameplay contracts or certify production models.

## Draft workflow

Before preparing a new vehicle proposal, consult the [open vehicle issues and review checks](AUDIT.md): Split Crown exhaust attachment and colour drift are unresolved. Existing integration drafts are not approved for rollout.

Each artwork subject has an `explorations/` folder. Put new drafts, variations, temporary renders and working prompts there; its contents are ignored by Git except for the `.gitkeep` placeholder. Use dated subfolders when an exploration needs multiple files.

After the owner approves a draft, move the selected image into the main subject folder with a clear, stable filename. Update this index and retain only the concise decisions and reproduction details needed for the approved result alongside it. Do not promote all intermediate attempts or treat a draft as approved merely because it is the newest image.

Unselected drafts stay disposable in `explorations/`; remove them when cleanup is requested. Ignored drafts are local-only, are not backed up by Git and still consume disk space until deleted. Git ignores do not remove files already tracked or shrink existing history. Keep the established archive intact; it is not the destination for every future draft.

## Archive

[Archive](archive/ARCHIVE_INDEX.md) contains all other material previously under this directory, including old documentation, prompts, explorations, alternate boards, models and model renders. Its documents preserve earlier statuses and paths as historical records, not competing current selections.

Documentation consolidation is a separate next step. Art and implementation documents outside this directory have not been moved or rewritten. Development reference code has not been updated for these paths, at the owner's request.
