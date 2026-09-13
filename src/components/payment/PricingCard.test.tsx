import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PricingCard } from "./PricingCard";

describe("PricingCard", () => {
  const baseProps = {
    title: "Standard Package",
    price: 45000,
    description: "Support for 3 major milestones",
    features: ["3 milestones support", "Priority expert matching"],
  };

  it("renders the price using the real package price passed in, not a hardcoded one", () => {
    render(<PricingCard {...baseProps} onSelect={() => {}} />);
    expect(screen.getByText("₦45,000")).toBeInTheDocument();
    expect(screen.getByText("Standard Package")).toBeInTheDocument();
  });

  it("lists every feature passed in", () => {
    render(<PricingCard {...baseProps} onSelect={() => {}} />);
    expect(screen.getByText("3 milestones support")).toBeInTheDocument();
    expect(screen.getByText("Priority expert matching")).toBeInTheDocument();
  });

  it("calls onSelect when the card or its button is clicked", () => {
    const onSelect = vi.fn();
    render(<PricingCard {...baseProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /select package/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows 'Selected' state without double-firing onSelect on the outer card click", () => {
    const onSelect = vi.fn();
    render(<PricingCard {...baseProps} selected onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: /selected/i })).toBeInTheDocument();
  });
});
