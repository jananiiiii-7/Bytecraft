import { describe, expect, it } from "vitest";
import { classifySignupError, describeSignupSuccess } from "./authErrors";

describe("signup handling", () => {
  it("maps duplicate accounts safely", () => {
    expect(classifySignupError({ message: "User already registered" }, true)).toContain("may already exist");
  });
  it("maps network failures to retry guidance", () => {
    expect(classifySignupError({ message: "Failed to fetch" }, true)).toContain("connection");
  });
  it("treats a user without a session as confirmation required", () => {
    expect(describeSignupSuccess({ user: { id: "u1" }, session: null })).toContain("Account created");
  });
  it("treats a user with a session as immediate success", () => {
    expect(describeSignupSuccess({ user: { id: "u1" }, session: { access_token: "redacted" } })).toBe("");
  });
});
