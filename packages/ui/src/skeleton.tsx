"use client";

/**
 * CX-STE — Skeleton.
 *
 * Client because of the 200ms rule: skeletons appear only past 200ms, so a fast
 * load never flashes one. That timer is the whole reason this is not a plain
 * server component.
 *
 * Skeletons must mirror the real row height and column widths, or the layout
 * jumps on load and the skeleton does more harm than a spinner. That also means
 * they have to be maintained alongside the real layout — the standard lists this
 * as the component's main cost.
 */
import { useEffect, useState } from "react";
import { cn } from "./lib/cn.js";

export interface SkeletonProps {
  /** Number of placeholder rows. Match the page size you actually request. */
  rows?: number;
  /** Column widths, as CSS values. Match the real columns. */
  columns?: string[];
  /** Row height in px. Match the real row so nothing shifts. */
  rowHeight?: number;
  /** Suppress until this many ms have passed. */
  delay?: number;
  className?: string;
}

export function Skeleton({
  rows = 5,
  columns = ["30%", "20%", "25%", "15%"],
  rowHeight = 44,
  delay = 200,
  className,
}: SkeletonProps) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  // Reserve the height even while hidden, so appearing does not shift the page.
  return (
    <div
      aria-hidden="true"
      className={cn("flex flex-col", className)}
      style={{ minHeight: rows * rowHeight }}
    >
      {visible &&
        Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="border-rule flex items-center gap-4 border-b px-4 last:border-b-0"
            style={{ height: rowHeight }}
          >
            {columns.map((width, column) => (
              <div
                key={column}
                className="bg-wash-2 h-3 animate-pulse rounded-sm"
                style={{ width }}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
