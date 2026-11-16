# W-05 Duplicate Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reimporting a saved source URL opens that recipe immediately, including when the dashboard list is stale.

**Architecture:** Query the authenticated user's full recipe row by source URL before calling the external import endpoint. Reuse the lookup before saving a reviewed draft and after a unique-key race. Map the returned row with existing recipe mapping and add it to local state if absent.

**Tech Stack:** React dashboard hook, Supabase JS, TypeScript, Node tests.

**Spec:** `docs/tasks.md` W-05 and `docs/specs/web.md` Add flow.

## Review Focus

- A duplicate URL must open the saved recipe without fetching the source site again.
- A stale dashboard list must not require refresh to open the duplicate.
- Updating the same recipe must not be treated as a duplicate.
- A unique-key race must resolve to the existing recipe when possible.
- Lookup failures must show an error instead of creating a duplicate or hiding a network failure.

## Task 1: Import decision

- [x] Add failing tests for duplicate URL, fresh URL, stale list, and lookup failure.
- [x] Implement a small import decision helper that checks an existing row before the import request.
- [x] Run focused tests to green.

## Task 2: Dashboard integration

- [x] Use a full-row Supabase lookup scoped to the authenticated user; open a found recipe and update local state.
- [x] Call the lookup before external import, before reviewed save, and after a 23505 race; preserve edit of the same recipe.
- [x] Run `npm run predeploy` and `git diff --check`.
