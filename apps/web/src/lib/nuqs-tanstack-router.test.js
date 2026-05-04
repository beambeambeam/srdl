import { describe, expect, it } from "bun:test";

import { getSortingStateParser } from "@srdl/ui/lib/parsers";

import { createSearchParamsFromSearch, serializeSearchValue } from "@/lib/nuqs-tanstack-router";

describe("nuqs tanstack router adapter helpers", () => {
  it("serializes arrays of objects as a single JSON query value", () => {
    const searchParams = createSearchParamsFromSearch({
      sort: [{ desc: false, id: "createdAt" }],
    });

    expect(searchParams.get("sort")).toBe('[{"desc":false,"id":"createdAt"}]');
    expect(searchParams.toString()).not.toContain("[object+Object]");
  });

  it("keeps primitive arrays as repeated query keys", () => {
    const searchParams = createSearchParamsFromSearch({
      tags: ["suite", "deluxe"],
    });

    expect(searchParams.getAll("tags")).toEqual(["suite", "deluxe"]);
  });

  it("serializes plain objects as JSON", () => {
    const searchParams = createSearchParamsFromSearch({
      filters: { title: ["suite"] },
    });

    expect(searchParams.get("filters")).toBe('{"title":["suite"]}');
  });

  it("ignores null and undefined values", () => {
    const searchParams = createSearchParamsFromSearch({
      filters: null,
      page: undefined,
      sort: [{ desc: true, id: "createdAt" }],
    });

    expect(searchParams.has("filters")).toBe(false);
    expect(searchParams.has("page")).toBe(false);
    expect(searchParams.get("sort")).toBe('[{"desc":true,"id":"createdAt"}]');
  });

  it("round-trips a serialized sort query through the table parser", () => {
    const parser = getSortingStateParser(["createdAt"]);
    const searchParams = createSearchParamsFromSearch({
      sort: [{ desc: true, id: "createdAt" }],
    });

    expect(parser.parse(searchParams.get("sort") ?? "")).toEqual([{ desc: true, id: "createdAt" }]);
  });

  it("serializes primitive values as strings", () => {
    expect(serializeSearchValue(10)).toBe("10");
    expect(serializeSearchValue(true)).toBe("true");
  });
});
