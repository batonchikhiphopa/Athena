import { useEffect, useState, type RefObject } from "react";
import type { EntryView } from "../entryTypes";

export function useEntryColumnCount(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
) {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateColumnCount = () => {
      const nextColumnCount = getEntryColumnCount(element.clientWidth, itemCount);
      setColumnCount((currentColumnCount) =>
        currentColumnCount === nextColumnCount
          ? currentColumnCount
          : nextColumnCount,
      );
    };

    updateColumnCount();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateColumnCount);
      return () => window.removeEventListener("resize", updateColumnCount);
    }

    const resizeObserver = new ResizeObserver(updateColumnCount);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [containerRef, itemCount]);

  return columnCount;
}

function getEntryColumnCount(containerWidth: number, itemCount: number) {
  if (itemCount <= 1) return 1;

  const rootFontSize =
    typeof document === "undefined"
      ? 16
      : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
        16;
  const minColumnWidth = 18.5 * rootFontSize;
  const columnGap = 0.75 * rootFontSize;
  const availableColumnCount = Math.max(
    1,
    Math.floor((containerWidth + columnGap) / (minColumnWidth + columnGap)),
  );

  return Math.min(itemCount, availableColumnCount);
}

export function distributeEntriesByColumn(entries: EntryView[], columnCount: number) {
  const columns = Array.from(
    { length: Math.max(1, Math.min(entries.length || 1, columnCount)) },
    () => [] as EntryView[],
  );

  entries.forEach((entry, index) => {
    columns[index % columns.length].push(entry);
  });

  return columns;
}
