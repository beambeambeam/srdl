/* eslint-disable complexity, no-array-reduce, no-inline-comments, no-nested-ternary */
import { useDebouncedCallback } from "@srdl/ui/hooks/use-debounced-callback";
import { getSortingStateParser } from "@srdl/ui/lib/parsers";
import type { ExtendedColumnSort, QueryKeys } from "@srdl/ui/types/data-table";
import {
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableOptions,
  TableState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import type { SingleParser, UseQueryStateOptions } from "nuqs";
import * as React from "react";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const FILTERS_KEY = "filters";
const JOIN_OPERATOR_KEY = "joinOperator";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

type DataTableInitialState<TData> = Omit<Partial<TableState>, "sorting"> & {
  sorting?: ExtendedColumnSort<TData>[];
};

export type DataTableFilterMapperInput = string | string[] | null | undefined;

export type DataTableFilterMapper<TValue> = (value: DataTableFilterMapperInput) => TValue;

export interface DataTableArgsConfig<
  TSortId extends string,
  TFilters extends Record<string, unknown>,
> {
  sortIds: readonly TSortId[];
  defaultSort?: Array<{
    desc: boolean;
    id: TSortId;
  }>;
  filters: {
    [K in keyof TFilters]: DataTableFilterMapper<TFilters[K]>;
  };
}

export interface DataTableArgsResult<
  TSortId extends string,
  TFilters extends Record<string, unknown>,
> {
  filters: TFilters;
  page: number;
  perPage: number;
  sort: Array<{
    desc: boolean;
    id: TSortId;
  }>;
}

interface UseDataTableQueryStateProps<TData> {
  columns: TableOptions<TData>["columns"];
  initialState?: DataTableInitialState<TData>;
  queryKeys?: Partial<QueryKeys>;
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
}

interface UseDataTableProps<
  TData,
  TSortId extends string = never,
  TFilters extends Record<string, unknown> = Record<string, never>,
>
  extends
    Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: DataTableInitialState<TData>;
  queryKeys?: Partial<QueryKeys>;
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
  tableArgs?: DataTableArgsConfig<TSortId, TFilters>;
}

export const asTrimmedStringFilter = (): DataTableFilterMapper<string | null> => (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
};

export function useDataTableQueryState<TData>(props: UseDataTableQueryStateProps<TData>) {
  const {
    columns,
    initialState,
    queryKeys,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
  } = props;
  const pageKey = queryKeys?.page ?? PAGE_KEY;
  const perPageKey = queryKeys?.perPage ?? PER_PAGE_KEY;
  const sortKey = queryKeys?.sort ?? SORT_KEY;
  const filtersKey = queryKeys?.filters ?? FILTERS_KEY;
  const joinOperatorKey = queryKeys?.joinOperator ?? JOIN_OPERATOR_KEY;

  const queryStateOptions = React.useMemo<Omit<UseQueryStateOptions<string>, "parse">>(
    () => ({
      clearOnDefault,
      debounceMs,
      history,
      scroll,
      shallow,
      startTransition,
      throttleMs,
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault, startTransition],
  );

  const [page, setPage] = useQueryState(
    pageKey,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1),
  );
  const [perPage, setPerPage] = useQueryState(
    perPageKey,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const pagination: PaginationState = React.useMemo(
    () => ({
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    }),
    [page, perPage],
  );

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage],
  );

  const columnIds = React.useMemo(
    () => new Set(columns.map((column) => column.id).filter(Boolean) as string[]),
    [columns],
  );

  const [sorting, setSorting] = useQueryState(
    sortKey,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? []),
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const newSorting = updaterOrValue(sorting);
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSorting],
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) {
      return [];
    }

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) {
      return {};
    }

    return filterableColumns.reduce<Record<string, SingleParser<string> | SingleParser<string[]>>>(
      (acc, column) => {
        if (column.meta?.options) {
          acc[column.id ?? ""] = parseAsArrayOf(parseAsString, ARRAY_SEPARATOR).withOptions(
            queryStateOptions,
          );
        } else {
          acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
        }
        return acc;
      },
      {},
    );
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback((values: typeof filterValues) => {
    void setPage(1);
    void setFilterValues(values);
  }, debounceMs);

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) {
      return [];
    }

    return Object.entries(filterValues).reduce<ColumnFiltersState>((filters, [key, value]) => {
      if (value !== null) {
        const processedValue = Array.isArray(value)
          ? value
          : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
            ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
            : [value];

        filters.push({
          id: key,
          value: processedValue,
        });
      }
      return filters;
    }, []);
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) {
        return;
      }

      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;

        const filterUpdates = next.reduce<Record<string, string | string[] | null>>(
          (acc, filter) => {
            if (filterableColumns.some((column) => column.id === filter.id)) {
              acc[filter.id] = filter.value as string | string[];
            }
            return acc;
          },
          {},
        );

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  return React.useMemo(
    () => ({
      columnFilters,
      filterValues,
      onColumnFiltersChange,
      onPaginationChange,
      onSortingChange,
      page,
      pagination,
      perPage,
      queryKeys: {
        filters: filtersKey,
        joinOperator: joinOperatorKey,
        page: pageKey,
        perPage: perPageKey,
        sort: sortKey,
      },
      sorting,
    }),
    [
      columnFilters,
      filterValues,
      filtersKey,
      joinOperatorKey,
      onColumnFiltersChange,
      onPaginationChange,
      onSortingChange,
      page,
      pageKey,
      pagination,
      perPage,
      perPageKey,
      sortKey,
      sorting,
    ],
  );
}

export function useDataTable<
  TData,
  TSortId extends string = never,
  TFilters extends Record<string, unknown> = Record<string, never>,
>(props: UseDataTableProps<TData, TSortId, TFilters>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    queryKeys,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    tableArgs: tableArgsConfig,
    ...tableProps
  } = props;
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  );

  const queryState = useDataTableQueryState({
    clearOnDefault,
    columns,
    debounceMs,
    enableAdvancedFilter,
    history,
    initialState,
    queryKeys,
    scroll,
    shallow,
    startTransition,
    throttleMs,
  });

  const tableArgs = React.useMemo<DataTableArgsResult<TSortId, TFilters> | undefined>(() => {
    if (!tableArgsConfig) {
      return undefined;
    }

    const allowedSortIds = new Set<string>(tableArgsConfig.sortIds);
    const mappedSort =
      queryState.sorting.length > 0
        ? queryState.sorting.reduce<Array<{ desc: boolean; id: TSortId }>>((sorts, sort) => {
            if (allowedSortIds.has(sort.id)) {
              sorts.push({
                desc: sort.desc,
                id: sort.id as TSortId,
              });
            }

            return sorts;
          }, [])
        : [];

    const sort = mappedSort.length > 0 ? mappedSort : (tableArgsConfig.defaultSort ?? []);
    const filters = Object.entries(tableArgsConfig.filters).reduce<TFilters>(
      (acc, [key, mapper]) => {
        acc[key as keyof TFilters] = mapper(queryState.filterValues[key]);
        return acc;
      },
      {} as TFilters,
    );

    return {
      filters,
      page: queryState.page,
      perPage: queryState.perPage,
      sort,
    };
  }, [
    queryState.filterValues,
    queryState.page,
    queryState.perPage,
    queryState.sorting,
    tableArgsConfig,
  ]);

  const table = useReactTable({
    ...tableProps,
    columns,
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    meta: {
      ...tableProps.meta,
      queryKeys: queryState.queryKeys,
    },
    onColumnFiltersChange: queryState.onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: queryState.onPaginationChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: queryState.onSortingChange,
    pageCount,
    state: {
      columnFilters: queryState.columnFilters,
      columnVisibility,
      pagination: queryState.pagination,
      rowSelection,
      sorting: queryState.sorting,
    },
  });

  return React.useMemo(
    () => ({ debounceMs, queryState, shallow, table, tableArgs, throttleMs }),
    [table, tableArgs, queryState, shallow, debounceMs, throttleMs],
  );
}
