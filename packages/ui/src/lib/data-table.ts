import type { Column } from "@tanstack/react-table";
import { dataTableConfig } from "@srdl/ui/config/data-table";
import type {
  ExtendedColumnFilter,
  FilterOperator,
  FilterVariant,
} from "@srdl/ui/types/data-table";

export function getColumnPinningStyle<TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>;
  withBorder?: boolean;
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right");

  return {
    background: isPinned ? "var(--background)" : "var(--background)",
    boxShadow: (() => {
      if (!withBorder) {
        return;
      }

      if (isLastLeftPinnedColumn) {
        return "-4px 0 4px -4px var(--border) inset";
      }

      if (isFirstRightPinnedColumn) {
        return "4px 0 4px -4px var(--border) inset";
      }
    })(),
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : undefined,
  };
}

export function getFilterOperators(filterVariant: FilterVariant) {
  const operatorMap: Record<FilterVariant, { label: string; value: FilterOperator }[]> = {
    boolean: dataTableConfig.booleanOperators,
    date: dataTableConfig.dateOperators,
    dateRange: dataTableConfig.dateOperators,
    multiSelect: dataTableConfig.multiSelectOperators,
    number: dataTableConfig.numericOperators,
    range: dataTableConfig.numericOperators,
    select: dataTableConfig.selectOperators,
    text: dataTableConfig.textOperators,
  };

  return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant);
  if (operators[0]) {
    return operators[0].value;
  }

  return filterVariant === "text" ? "iLike" : "eq";
}

export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  return filters.filter(
    (filter) =>
      filter.operator === "isEmpty" ||
      filter.operator === "isNotEmpty" ||
      (Array.isArray(filter.value) && filter.value.length > 0) ||
      (!Array.isArray(filter.value) &&
        filter.value !== "" &&
        filter.value !== null &&
        filter.value !== undefined),
  );
}
