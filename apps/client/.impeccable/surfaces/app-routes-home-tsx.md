---
version: 1
slug: "app-routes-home-tsx"
primary_target: "app/routes/home.tsx"
related_targets: ["app/routes/home"]
---

# Main menu (`/`)

Scope: the index route and its parts in `app/routes/home/`, plus `ui/button.tsx`, `ui/panel.tsx`,
`lobby/room-list.tsx`. Mode: Persuade. Two audiences equally: invited friends (fast path to GO) and cold
visitors (understand SLUR in one screen). Owner rejects: generic web landing, cyan/neon TRON, busy HUD
clutter, slow to GO. Lead: the live world.

## Direction contract

THESIS: The menu is a race-broadcast lower third laid over a live cruise shot of the real track. It refuses
the centred hero-plus-glass-card landing.

OWN-WORLD: Deep Space `#0A1117` to Space Grey `#162028` graphite, Chakra Petch in HUD white `#ECEFF2`,
marigold `#F59A24` only on the active or primary control, `#FFE0A0` core only on a pressed or focused
primary. Square-cut strips, 1px marigold edge rules, no glass, no cyan.

STORY: A visitor sees the game racing, reads one line of what it is, types a call sign, picks a ship, and
hosts or taps a live room.

FIRST VIEWPORT: The full-bleed cruise shot owns the top ~70%. Small SLUR mark top-left. At bottom-left, the
tagline and a one-line pitch. A row of live-room chips. A full-width bottom strip: call sign, ship ◂ name
▸, HOST ▸ (the primary). Keycap hint at the strip's right end.

FORM: Broadcast lower third, candidate 5 of 7 on my ranked list; seed key 31489d20.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: A/D (and ◂ ▸) cycle the ship. The ship on the deck banks into the change, and the
strip's marigold edge sweeps to the new name. Reduced motion: an instant swap.

## Open

- Backdrop mechanism: lean scene or trimmed reuse of the game scene. Decide by measured draw calls and
  ms/frame.
