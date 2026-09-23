---
name: eyeballing-a-tap-lies-about-brightness
description: A viewed frame-tap reads far brighter than its pixels; composite a known grey ramp before trusting any brightness impression
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7aa100d3-c5f2-4a6c-9ef2-f3ff1d699435
  modified: 2026-09-23T03:49:56.121Z
---

Looking at a `/test-level` frame tap and judging a surface's value is unreliable by a factor of
three. The deck measures rgb(26–31) and reads as mid-grey; a `0x1a1a1a` patch composited into the
same frame is nearly invisible against it, while `0x404040` is obviously lighter. The frame is
mostly near-black, so every lit area reads far above its real value.

**Why:** simultaneous contrast against a near-black surround, not display normalisation — a
standalone 0/26/64/128 ramp renders faithfully.

**How to apply:** before claiming a surface is dark, bright, washed or black, measure it. Decode
with `ffmpeg -i f.png -f rawvideo -pix_fmt rgb24 -` and index the buffer; there is no PNG decoder in
node and [[no-python-for-tooling]] rules out the obvious one. To sanity-check a reading, composite a
ramp into the real frame with `ffmpeg -vf "drawbox=...:color=0x404040@1:t=fill"` and compare in
place. `drawbox` with `t=3` also marks a probe rectangle, which is the only safe way to confirm a
sample region sits on the surface you think it does — a face identified by eye is often the
neighbouring one. Related: [[headless-chrome-for-frame-taps]].
