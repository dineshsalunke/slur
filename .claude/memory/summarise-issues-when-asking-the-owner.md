---
name: summarise-issues-when-asking-the-owner
description: "OWNER RULE: never ask the owner about an issue by number alone — give its title and a one-line summary"
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb83d649-4df5-4b18-bac4-76b56570e3b7
  modified: 2026-09-27T05:05:17.096Z
---

When a question to the owner names a GitHub issue, give the **title and a one-line summary** of what it is
and why it is being asked about, not just `#114`. The same applies to backlog rows and ADRs.

**Why:** 2026-09-27 the supervisor asked "Close #292, #6, #11? Close #114?" in a multi-select. The owner
rejected it: "how do you expect me to know what is #114". The owner does not keep issue numbers in their head.

**How to apply:** fetch `gh issue view <n> --json title,body,comments` before asking. Format each item as
`#n — <title>: <what it is / what shipped / why close>`. Applies to worker reports the supervisor relays
too: rewrite bare numbers before they reach the owner.
