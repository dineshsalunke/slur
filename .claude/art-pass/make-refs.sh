#!/usr/bin/env bash
# Generate context-cheap board references for the art pass.
#
# The source boards are 1536x1024 PNGs at ~2 MB each. Reading one costs ~2.1k tokens and STILL does not
# resolve the small surface-detail panels, which are the actual spec. So:
#   - `small`  1024px-wide JPEG for the whole-board glance  (~100 KB, ~0.6k tokens)
#   - `crop`   native-resolution region for reading a panel (no downscale, so the text resolves)
#
# Outputs are gitignored. Regenerate, never commit.
# Uses macOS `sips` — no ImageMagick, no Python (NN-1).

set -euo pipefail

here="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
boards="$here/../../docs/art-direction/boards"

usage() {
    cat <<'EOF'
Usage:
  make-refs.sh small <task-folder> <board-stem>...
      1024px JPEG of each board into <task-folder>/refs/

  make-refs.sh crop <task-folder> <board-stem> <x> <y> <w> <h> [label]
      native-res crop (offset x,y size w,h) into <task-folder>/refs/

  make-refs.sh dims <board-stem>
      print the board's pixel dimensions (to plan a crop)

  make-refs.sh list
      list available board stems

Board stems omit the .png, e.g. 12_approved_scene_marigold_depth
EOF
}

cmd="${1:-}"; shift || true

case "$cmd" in
    list)
        ls "$boards" | sed 's/\.png$//' | grep -v README
        ;;

    dims)
        sips -g pixelWidth -g pixelHeight "$boards/$1.png" | tail -2
        ;;

    small)
        task="$here/$1"; shift
        mkdir -p "$task/refs"
        for stem in "$@"; do
            out="$task/refs/${stem}.small.jpg"
            sips -s format jpeg -s formatOptions 65 -Z 1024 "$boards/$stem.png" --out "$out" >/dev/null
            printf '%s  %s\n' "$( du -h "$out" | cut -f1 )" "${out#"$here"/}"
        done
        ;;

    crop)
        task="$here/$1"; stem="$2"; x="$3"; y="$4"; w="$5"; h="$6"; label="${7:-crop}"
        mkdir -p "$task/refs"
        out="$task/refs/${stem}.${label}.jpg"
        # ffmpeg, not sips: `sips --cropOffset` is centre-relative with undocumented scaling and produced
        # wrong regions under test. `crop=w:h:x:y` is exact, top-left origin.
        ffmpeg -loglevel error -y -i "$boards/$stem.png" -vf "crop=$w:$h:$x:$y" -q:v 3 "$out"
        printf '%s  %s\n' "$( du -h "$out" | cut -f1 )" "${out#"$here"/}"
        ;;

    *)
        usage; exit 1
        ;;
esac
