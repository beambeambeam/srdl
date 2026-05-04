import { useLocation, useRouter } from "@tanstack/react-router";
import type { unstable_UpdateUrlFunction } from "nuqs/adapters/custom";
import { renderQueryString, unstable_createAdapterProvider } from "nuqs/adapters/custom";
import { startTransition, useCallback, useMemo } from "react";

const isPrimitiveSearchValue = (value: unknown): value is boolean | bigint | number | string => {
  const valueType = typeof value;

  return (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean" ||
    valueType === "bigint"
  );
};

export const serializeSearchValue = (value: unknown): string | string[] | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.every(isPrimitiveSearchValue)) {
      const serializedItems = value.map(String);

      return serializedItems.length > 0 ? serializedItems : null;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export const createSearchParamsFromSearch = (search: Record<string, unknown>): URLSearchParams => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    const serializedValue = serializeSearchValue(value);

    if (serializedValue === null) {
      continue;
    }

    if (Array.isArray(serializedValue)) {
      for (const item of serializedValue) {
        searchParams.append(key, item);
      }

      continue;
    }

    searchParams.set(key, serializedValue);
  }

  return searchParams;
};

function useNuqsTanstackRouterAdapter(watchKeys: string[]) {
  const pathname = useLocation({ select: (state) => state.pathname });
  const search = useLocation({
    select: (state) =>
      Object.fromEntries(Object.entries(state.search).filter(([key]) => watchKeys.includes(key))),
  });
  const { navigate } = useRouter();

  return {
    rateLimitFactor: 1,
    searchParams: useMemo(() => createSearchParamsFromSearch(search), [search]),
    updateUrl: useCallback(
      ((searchParams, options) => {
        startTransition(() => {
          navigate({
            from: "/",
            hash: (prevHash) => prevHash ?? "",
            replace: options.history === "replace",
            resetScroll: options.scroll,
            state: (state) => state,
            to: pathname + renderQueryString(searchParams),
          });
        });
      }) satisfies unstable_UpdateUrlFunction,
      [navigate, pathname],
    ),
  };
}

export const NuqsTanstackRouterAdapter = unstable_createAdapterProvider(
  useNuqsTanstackRouterAdapter,
);
