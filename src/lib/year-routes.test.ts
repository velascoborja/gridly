import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseYearRoutePathname,
  getYearRoutePrefix,
  buildYearMonthHref,
  buildYearSummaryHref,
  buildSettingsHref,
  buildSetupHref,
  buildSetupHrefFromPathname,
} from "./year-routes.ts";

describe("year-routes", () => {
  describe("parseYearRoutePathname", () => {
    it("parses month paths", () => {
      assert.deepEqual(parseYearRoutePathname("/es/2026/4"), { year: 2026, view: "overview", month: 4 });
      assert.deepEqual(parseYearRoutePathname("/2026/12"), { year: 2026, view: "overview", month: 12 });
    });

    it("parses summary paths", () => {
      assert.deepEqual(parseYearRoutePathname("/es/2026/summary"), { year: 2026, view: "summary", month: null });
    });

    it("parses settings paths", () => {
      assert.deepEqual(parseYearRoutePathname("/es/settings"), { year: null, view: "settings", month: null });
    });

    it("returns null for unknown paths", () => {
      assert.equal(parseYearRoutePathname("/about"), null);
    });
  });

  describe("getYearRoutePrefix", () => {
    it("extracts prefix from month path", () => {
      assert.equal(getYearRoutePrefix("/es/2026/4", 2026), "/es");
    });

    it("extracts prefix from summary path", () => {
      assert.equal(getYearRoutePrefix("/es/2026/summary", 2026), "/es");
    });

    it("extracts prefix from settings path", () => {
      assert.equal(getYearRoutePrefix("/es/settings", 2026), "/es");
    });

    it("returns empty string if no prefix", () => {
      assert.equal(getYearRoutePrefix("/2026/4", 2026), "");
    });
  });

  describe("Href Builders", () => {
    it("buildYearMonthHref", () => {
      assert.equal(buildYearMonthHref("/es", 2026, 4), "/es/2026/4");
      assert.equal(buildYearMonthHref("", 2026, 4), "/2026/4");
      assert.equal(buildYearMonthHref(undefined, 2026, 4), "/2026/4");
    });

    it("buildYearSummaryHref", () => {
      assert.equal(buildYearSummaryHref("/es", 2026), "/es/2026/summary");
      assert.equal(buildYearSummaryHref(undefined, 2026), "/2026/summary");
    });

    it("buildSettingsHref", () => {
      assert.equal(buildSettingsHref("/es"), "/es/settings");
      assert.equal(buildSettingsHref(""), "/settings");
    });

    it("buildSetupHref", () => {
      assert.equal(buildSetupHref(2027, "/2026/summary"), "/setup/2027?redirect=%2F2026%2Fsummary");
    });
  });

  describe("buildSetupHrefFromPathname", () => {
    it("extracts return path from summary pathname", () => {
      assert.equal(buildSetupHrefFromPathname(2027, "/es/2026/summary", 2026, 4, "summary"), "/setup/2027?redirect=%2F2026%2Fsummary");
    });

    it("extracts return path from month pathname", () => {
      assert.equal(buildSetupHrefFromPathname(2027, "/es/2026/6", 2026, 4, "overview"), "/setup/2027?redirect=%2F2026%2F6");
    });

    it("falls back to view state for unknown paths", () => {
      assert.equal(buildSetupHrefFromPathname(2027, "/es/settings", 2026, 4, "overview"), "/setup/2027?redirect=%2F2026%2F4");
    });
  });
});
