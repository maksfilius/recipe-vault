# W-04 First Cook Hint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a user's first successful recipe save, open the recipe and show one brief hint next to `Start cooking`.

**Architecture:** The recipe already opens after saving. Add a per-user localStorage claim for the one-time hint, trigger it only after a confirmed first create with a cookable step, and render a dismissible inline hint in recipe details.

**Tech Stack:** React, TypeScript, Node test runner, existing dashboard components.

**Spec:** `docs/tasks.md`, W-04; `docs/design-recipe-details.md`.

## Task 1: One-time eligibility

- [x] Add a failing unit test for first create, repeat create, edit, missing steps, and separate users.
- [x] Implement `claimFirstCookHint` using a per-user storage key.
- [x] Run the focused test and confirm green.

## Task 2: Show the hint at the action

- [x] Call the claim only after `save_recipe` succeeds; retain the existing open-card behavior.
- [x] Show the hint beside `Start cooking` with an accessible dismiss control, and clear it on start/back.
- [x] Run `npm run predeploy` and `git diff --check`; record any remaining user-study gate.

**Open acceptance gate:** the 2–3 new-user usability check from W-04 has not been run. Automated checks cover the one-time claim and build, not a person's ability to complete the first save unaided.
