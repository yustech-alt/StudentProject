import { describe, it, expect } from "vitest";
import { safeValidateProfileUpdate, validateProjectEventData, projectEventDataSchema } from "./validations";

describe("safeValidateProfileUpdate", () => {
  it("accepts a normal, well-formed profile update", () => {
    const result = safeValidateProfileUpdate({
      full_name: "Ada Lovelace",
      bio: "Final year computer science student.",
      phone: "+234 801 234 5678",
      location: "Lagos, Nigeria",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a full_name over 100 characters (matches the DB trigger limit)", () => {
    const result = safeValidateProfileUpdate({ full_name: "A".repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/100 characters/);
  });

  it("rejects a bio over 1000 characters (matches the DB trigger limit)", () => {
    const result = safeValidateProfileUpdate({ bio: "A".repeat(1001) });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/1000 characters/);
  });

  it("rejects phone numbers containing letters", () => {
    const result = safeValidateProfileUpdate({ phone: "call-me-maybe" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty string for avatar_url (used to clear it) but rejects garbage", () => {
    expect(safeValidateProfileUpdate({ avatar_url: "" }).success).toBe(true);
    expect(safeValidateProfileUpdate({ avatar_url: "not-a-url" }).success).toBe(false);
  });

  it("rejects an empty full_name when explicitly provided", () => {
    const result = safeValidateProfileUpdate({ full_name: "" });
    expect(result.success).toBe(false);
  });
});

describe("validateProjectEventData", () => {
  it("accepts known, short fields", () => {
    const data = validateProjectEventData({ milestone_title: "Chapter 1", confirmed_by: "Ada" });
    expect(data.milestone_title).toBe("Chapter 1");
  });

  it("rejects unknown fields (schema is strict, mirrors the 10KB DB check)", () => {
    const result = projectEventDataSchema.safeParse({ not_a_real_field: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized field", () => {
    const result = projectEventDataSchema.safeParse({ milestone_title: "x".repeat(500) });
    expect(result.success).toBe(false);
  });
});
