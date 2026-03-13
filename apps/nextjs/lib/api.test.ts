import { describe, expect, it } from "vitest";
import { buildApiUrl } from "./api";

describe("buildApiUrl", () => {
  it("keeps a single /api prefix when base is /api", () => {
    expect(buildApiUrl("/api/roi/filters", "/api")).toBe("/api/roi/filters");
  });

  it("keeps a single /api prefix when base has trailing slash", () => {
    expect(buildApiUrl("/api/roi/data?predict=true", "/api/")).toBe(
      "/api/roi/data?predict=true",
    );
  });

  it("joins full host base with api path", () => {
    expect(buildApiUrl("/api/roi/filters", "http://localhost:3001")).toBe(
      "http://localhost:3001/api/roi/filters",
    );
  });

  it("normalizes path without leading slash", () => {
    expect(buildApiUrl("api/roi/clear", "http://localhost:3001/")).toBe(
      "http://localhost:3001/api/roi/clear",
    );
  });
});
