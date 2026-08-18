"use client";

/**
 * CX-TAG — Code. Machine values: IDs, permission codes, hashes, versions.
 *
 * Client because copy-in-one-click needs the clipboard. Mono at radius-sm on a
 * grey-1 fill, per the standard.
 */
import { useCallback, useState } from "react";
import { cn } from "./lib/cn.js";

export interface CodeProps {
  children: string;
  /** Adds a one-click copy affordance. */
  copyable?: boolean;
  className?: string;
}

export function Code({ children, copyable, className }: CodeProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    // Clipboard can reject (permissions, insecure origin). Failing silently
    // would leave the user thinking it worked, so only confirm on success.
    void navigator.clipboard
      ?.writeText(children)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => setCopied(false));
  }, [children]);

  const base =
    "bg-dark-grey text-fg-2 border-rule inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[11px]";

  if (!copyable) {
    return <code className={cn(base, className)}>{children}</code>;
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${children}`}
      className={cn(
        base,
        "hover:text-fg hover:border-accent/40 duration-instant ease-brand cursor-pointer transition-colors",
        className,
      )}
    >
      <span>{children}</span>
      <span aria-hidden="true" className={cn("text-[10px]", copied && "text-ok")}>
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
}
