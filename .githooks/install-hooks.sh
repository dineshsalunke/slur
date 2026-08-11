#!/bin/sh
# Install the shared-checkout commit guard WITHOUT disturbing git-lfs.
#
# Run by the root package.json `prepare` script, so any `pnpm install` (which every agent runs
# per worktree) wires it. We copy ONE hook — pre-commit — into the repo's COMMON hooks dir
# (`.git/hooks`), which is shared by the main checkout and every linked worktree, so a single
# install covers them all.
#
# Why a copy and NOT `core.hooksPath=.githooks`: git-lfs manages its own hooks
# (post-checkout / post-commit / post-merge / pre-push) in `.git/hooks`. Pointing core.hooksPath
# at a tracked dir DISPLACES those — and disables them entirely in any checkout where that dir is
# absent, silently skipping LFS's pre-push upload. git-lfs does not use pre-commit, so copying
# ours alongside its hooks is collision-free. See CLAUDE.md "Concurrent agents".

set -e

# Undo a stale core.hooksPath from an earlier version of this script — LFS needs the default dir.
if [ "$(git config --get core.hooksPath 2>/dev/null)" = ".githooks" ]; then
    git config --unset core.hooksPath
fi

hooks_dir="$(git rev-parse --git-common-dir)/hooks"
mkdir -p "$hooks_dir"
cp .githooks/pre-commit "$hooks_dir/pre-commit"
chmod +x "$hooks_dir/pre-commit"
