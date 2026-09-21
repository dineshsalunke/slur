# HUD exploration — initial proposal

User asks for subtle motion blur and a HUD including rear-view mirror, connected players, held items and possible stats. Mirror is a user requirement regardless of older TDD wording that deferred it. Candidate 10 reduces blur; central tiles are clearer, though peripheral streaking remains stronger than an eventual subtle gameplay target. Generated with built-in image tool, prompt in SUBTLE-BLUR-PROMPT.txt.

Proposed layout, not approved: top-center shallow wide rear-view mirror; upper-left compact race-order/player roster with own row emphasized and connection/spectator state distinguished; bottom-left speed, race position and course progress; bottom-right one held-item slot with silhouette, name and use prompt. Active boost/shield state separate from held inventory. Small race timer secondary. No invented health/fuel/ammo bars or lap count.

GDD section 5.3 records a single held slot, no stacking; controls list E/LMB for use. It also has older unresolved inventory wording elsewhere; single-slot is the initial design baseline pending any user correction. HUD layouts remain proposals, not a current runtime audit.

Graphite backing sufficient for legibility over bright scenery, pale neutral text, marigold reserved for selection/readiness/alerts. Minimal bloom on HUD, no elaborate cockpit framing. Keep central road and vanishing point clear. Rear-view should not inherit boost blur; incoming threat cue can accent its frame temporarily.

Player count stays visible; expanded roster can show all connected players, while a compact race view prioritizes nearby standings. Full-race roster versus compact-default choice remains open. Connection count and race position are separate concepts.

Optional statistics: elapsed race time and remaining distance. Ping/FPS belong in an optional diagnostics view. Avoid adding metrics solely to decorate empty screen space.
