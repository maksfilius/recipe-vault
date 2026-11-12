import * as React from "react";

import { cn } from "../../lib/utils";

export type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
        selected
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary-hover"
          : "border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = "Chip";
