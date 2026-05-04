import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { JSDOM } from "jsdom";

/* eslint-disable promise/prefer-await-to-callbacks */
function installDomGlobals() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const { window } = dom;

  Object.assign(globalThis, {
    DocumentFragment: window.DocumentFragment,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    Node: window.Node,
    SVGElement: window.SVGElement,
    document: window.document,
    getComputedStyle: window.getComputedStyle.bind(window),
    window,
  });

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator,
  });

  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback) => {
      callback(0);

      return 0;
    },
  });

  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: () => {},
  });
}
/* eslint-enable promise/prefer-await-to-callbacks */

installDomGlobals();

const { cleanup, fireEvent, render, waitFor } = await import("@testing-library/react");
const { AdminRoomTable } = await import("@/features/admin/room/table");

describe("AdminRoomTable sorting", () => {
  beforeAll(() => {
    installDomGlobals();
  });

  afterEach(() => {
    cleanup();
  });

  it("writes stable JSON sort state for an asc click", async () => {
    const onUrlUpdate = mock(() => {});
    const view = render(
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <AdminRoomTable />
      </NuqsTestingAdapter>,
    );

    expect(onUrlUpdate.mock.calls).toHaveLength(0);

    fireEvent.click(view.getByRole("button", { name: /created at/i }));
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: /asc/i }));

    await waitFor(() => {
      expect(onUrlUpdate.mock.calls.length).toBeGreaterThan(0);
    });

    const ascQueryString = onUrlUpdate.mock.calls.at(-1)?.[0].queryString;
    const ascSortValue = new URLSearchParams(ascQueryString).get("sort");

    expect(JSON.parse(ascSortValue)).toEqual([{ desc: false, id: "createdAt" }]);
    expect(ascQueryString).not.toContain("[object+Object]");
  });

  it("writes stable JSON sort state for a desc click from existing sort state", async () => {
    const onUrlUpdate = mock(() => {});
    const view = render(
      <NuqsTestingAdapter
        hasMemory
        onUrlUpdate={onUrlUpdate}
        searchParams={{
          sort: '[{"desc":false,"id":"createdAt"}]',
        }}
      >
        <AdminRoomTable />
      </NuqsTestingAdapter>,
    );

    fireEvent.click(view.getByRole("button", { name: /created at/i }));
    fireEvent.click(await view.findByRole("menuitemcheckbox", { name: /desc/i }));

    await waitFor(() => {
      expect(onUrlUpdate.mock.calls.length).toBeGreaterThan(0);
    });

    const descQueryString = onUrlUpdate.mock.calls.at(-1)?.[0].queryString;
    const descSortValue = new URLSearchParams(descQueryString).get("sort");

    expect(JSON.parse(descSortValue)).toEqual([{ desc: true, id: "createdAt" }]);
    expect(descQueryString).not.toContain("[object+Object]");
  });

  it("rehydrates an existing sort query without degrading it", async () => {
    const view = render(
      <NuqsTestingAdapter
        hasMemory
        searchParams={{
          sort: '[{"desc":true,"id":"createdAt"}]',
        }}
      >
        <AdminRoomTable />
      </NuqsTestingAdapter>,
    );

    fireEvent.click(view.getByRole("button", { name: /created at/i }));

    const descMenuItem = await view.findByRole("menuitemcheckbox", { name: /desc/i });

    expect(descMenuItem.getAttribute("aria-checked")).toBe("true");
  });
});
