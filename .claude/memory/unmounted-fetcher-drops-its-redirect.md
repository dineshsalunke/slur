---
name: unmounted-fetcher-drops-its-redirect
description: A useFetcher action that makes its own row unmount before it returns loses its redirect; change the store only on the non-redirect path
metadata:
  node_type: memory
  type: project
  originSessionId: 4d36fc84-6687-4be2-b33a-9c0512839609
  modified: 2026-09-27T04:30:48.346Z
---

A `useFetcher` submit whose action updates a store that unmounts the fetcher's component, before the
action returns, loses its `redirect()`. React Router drops a deleted fetcher's result, so the page never
navigates. The action itself still ran: the file was deleted and the URL stayed.

**Why:** #307 (ca9e35a). Deleting the open track called `changed()` on the saved list inside the action.
The row that held the fetcher disappeared, and the redirect to `/test-level/edit` did nothing. Seen live
on :5173. The React Router internals were not read, so the cause is inferred.

**How to apply:** in a fetcher action that may redirect, do not touch reactive state before
`return redirect(...)`. Let the loader of the redirect target reload it. Change the store only on the
non-redirect path. Otherwise, use a navigation `<Form>`. Related: [[live-hmr-sees-half-applied-edits]].
