import test from "node:test";
import assert from "node:assert/strict";
import { getOAuthErrorCode, getOAuthFailurePath, getOAuthRedirectTo, readOAuthCallback } from "../src/lib/oauth.ts";

const shared = `/dashboard?add=select&url=${encodeURIComponent("https://site.example/soup")}`;
const query = (value: string) => new URLSearchParams(value);

test("Google returns to the callback on this origin with only an allowed destination", () => {
  assert.equal(getOAuthRedirectTo("https://keepandcook.com", "/dashboard"), "https://keepandcook.com/auth/callback");
  assert.equal(getOAuthRedirectTo("http://localhost:3001", shared), `http://localhost:3001/auth/callback?next=${encodeURIComponent(shared)}`);
  for (const next of ["https://evil.example", "//evil.example", "/dashboard?next=https://evil.example", null]) {
    assert.equal(getOAuthRedirectTo("https://keepandcook.com", next), "https://keepandcook.com/auth/callback");
  }
});

test("the callback exchanges a code and keeps the validated destination", () => {
  assert.deepEqual(readOAuthCallback(query(`code=abc&next=${encodeURIComponent(shared)}`)),
    { kind: "exchange", code: "abc", destination: shared, failurePath: `/login?auth_error=failed&next=${encodeURIComponent(shared)}` });
  assert.deepEqual(readOAuthCallback(query("code=abc")), { kind: "exchange", code: "abc", destination: "/dashboard", failurePath: "/login?auth_error=failed" });
  // A tampered next never leaves the site.
  for (const next of ["https://evil.example/steal", "//evil.example", "/\\evil.example", "/dashboard#x"]) {
    assert.deepEqual(readOAuthCallback(query(`code=abc&next=${encodeURIComponent(next)}`)), { kind: "exchange", code: "abc", destination: "/dashboard", failurePath: "/login?auth_error=failed" });
  }
});

test("cancelling at Google and other failures go back to sign-in with a reason", () => {
  assert.deepEqual(readOAuthCallback(query("error=access_denied&error_description=The+user+denied")), { kind: "error", path: "/login?auth_error=cancelled" });
  assert.deepEqual(readOAuthCallback(query(`error=server_error&next=${encodeURIComponent(shared)}`)), { kind: "error", path: `/login?auth_error=failed&next=${encodeURIComponent(shared)}` });
  assert.deepEqual(readOAuthCallback(query("")), { kind: "error", path: "/login?auth_error=failed" });
  assert.deepEqual(readOAuthCallback(query(`code=${"x".repeat(600)}`)), { kind: "error", path: "/login?auth_error=failed" });
  assert.equal(getOAuthFailurePath("failed", "https://evil.example"), "/login?auth_error=failed");
});

test("the confirmation email returns through the callback and explains its own failures", () => {
  assert.equal(getOAuthRedirectTo("https://keepandcook.com", "/dashboard", "email"), "https://keepandcook.com/auth/callback?flow=email");
  assert.equal(getOAuthRedirectTo("https://keepandcook.com", shared, "email"), `https://keepandcook.com/auth/callback?next=${encodeURIComponent(shared)}&flow=email`);
  // Confirmed, but the code cannot be exchanged here (another browser): sign in, not "Google failed".
  assert.deepEqual(readOAuthCallback(query("code=abc&flow=email")), { kind: "exchange", code: "abc", destination: "/dashboard", failurePath: "/login?auth_error=confirmed" });
  // Expired or reused link (Supabase sends error=access_denied&error_code=otp_expired).
  assert.deepEqual(readOAuthCallback(query("error=access_denied&error_code=otp_expired&flow=email")), { kind: "error", path: "/login?auth_error=link_expired" });
  assert.deepEqual(readOAuthCallback(query("flow=email")), { kind: "error", path: "/login?auth_error=link_expired" });
  assert.equal(getOAuthErrorCode("confirmed"), "confirmed");
  assert.equal(getOAuthErrorCode("link_expired"), "link_expired");
});

test("only known error codes become messages", () => {
  assert.equal(getOAuthErrorCode("cancelled"), "cancelled");
  assert.equal(getOAuthErrorCode("unavailable"), "unavailable");
  for (const value of [null, "", "<script>", "toString", "__proto__"]) assert.equal(getOAuthErrorCode(value), null);
});
