import test from "node:test";
import assert from "node:assert/strict";

import { getFriendlyAuthErrorMessage } from "../src/lib/auth-errors.ts";

test("maps invalid login credentials to a user-friendly message", () => {
  assert.equal(
    getFriendlyAuthErrorMessage("Invalid login credentials"),
    "Incorrect email or password.",
  );
});

test("maps email confirmation errors to a clearer instruction", () => {
  assert.equal(
    getFriendlyAuthErrorMessage("Email not confirmed"),
    "Confirm your email before signing in. Check your inbox for the verification link.",
  );
});

test("passes through unknown messages unchanged", () => {
  assert.equal(
    getFriendlyAuthErrorMessage("Something custom happened"),
    "Something custom happened",
  );
});

