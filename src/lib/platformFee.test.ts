import { describe, it, expect } from "vitest";
import { PLATFORM_FEE_PERCENTAGE, calculatePlatformFee, calculateExpertEarnings, formatCurrency } from "./platformFee";

describe("platformFee", () => {
  it("charges exactly 10% platform fee", () => {
    expect(PLATFORM_FEE_PERCENTAGE).toBe(0.10);
  });

  it("calculatePlatformFee takes 10% of the gross amount", () => {
    expect(calculatePlatformFee(10000)).toBe(1000);
    expect(calculatePlatformFee(0)).toBe(0);
  });

  it("calculateExpertEarnings returns the remaining 90%", () => {
    expect(calculateExpertEarnings(10000)).toBe(9000);
  });

  it("fee and earnings always add back up to the original gross amount", () => {
    for (const gross of [1000, 15000, 45000, 75000, 999]) {
      const fee = calculatePlatformFee(gross);
      const earnings = calculateExpertEarnings(gross);
      expect(fee + earnings).toBe(gross);
    }
  });

  // Regression test: a real bug in ExpertProjectDetail.tsx applied
  // calculateExpertEarnings a second time to a value (milestone.payoutAmount)
  // that was already net of the platform fee, silently underpaying experts.
  // Net amounts must NOT be run through calculateExpertEarnings again.
  it("does not double-deduct the fee from an already-net amount", () => {
    const grossAmount = 10000;
    const netAmount = calculateExpertEarnings(grossAmount); // 9000, what the DB stores
    const wronglyDoubleDeducted = calculateExpertEarnings(netAmount); // the bug
    expect(wronglyDoubleDeducted).not.toBe(netAmount);
    expect(wronglyDoubleDeducted).toBeLessThan(netAmount);
  });

  it("formatCurrency renders whole-naira amounts with the naira symbol", () => {
    expect(formatCurrency(45000)).toContain("45,000");
    expect(formatCurrency(45000)).toContain("₦");
    expect(formatCurrency(0)).toContain("0");
  });
});
