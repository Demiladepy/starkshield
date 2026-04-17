import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import McpStatusPage from "@/app/dashboard/mcp/page";

let writeTextMock: ReturnType<typeof vi.fn>;

describe("McpStatusPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 200,
        json: async () => ({ ok: true, message: "MCP status fetched.", data: { mode: "http" } }),
      })),
    );
    writeTextMock = vi.fn(async () => {});
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("schedules polling and renders status payload", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    render(<McpStatusPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy.mock.calls[0]?.[1]).toBe(10_000);
    expect(screen.getByText(/MCP status fetched/)).toBeInTheDocument();
  });

  it("copies install snippet to clipboard", async () => {
    const user = userEvent.setup();
    render(<McpStatusPage />);

    await user.click(screen.getByRole("button", { name: "Copy install JSON" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument());
  });
});
