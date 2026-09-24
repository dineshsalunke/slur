---
name: svg-polyline-raster-per-tile
description: A long SVG polyline is replayed whole for every raster tile it crosses; chunk it so each piece has local bounds
metadata:
  node_type: memory
  type: project
  originSessionId: 26ad019c-5433-4eed-8b8b-67a21a702d0e
  modified: 2026-09-24T08:19:33.851Z
---

Chrome culls paint ops per raster tile by their bounds. A single 8000-point `<polyline>` across a
35k-px SVG is replayed in full for every tile. On `/pacing`, 19 polylines were about 90% of raster
work: removing them cut `DisplayItemList::Raster` from 326 to 35 ms, and removing 1318 rects changed
nothing. Emitting 64-point chunks cut total raster from 409 to 172 ms (software raster, DPR 2).

**Why:** measured over CDP tracing (`cc`, `disabled-by-default-cc.debug`) with a synthesized scroll
gesture. `LayerTreeHostImpl::CalculateRenderPasses` has a `missing tiles` arg per frame, which counts
checkerboarding directly (2026-09-24, #245).

**How to apply:** for wide plots, split long paths into chunks. To measure paint delay, count
`missing tiles` and sum `RasterTask`, not DOM time. GPU raster on the M1 Pro hides the cost, so A/B
with `--disable-gpu-rasterization`. See [[react-dev-tracks-walk-typed-array-props]].
