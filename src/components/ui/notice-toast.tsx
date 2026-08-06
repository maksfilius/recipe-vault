"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";

import { cn } from "@/src/lib/utils";

export type NoticeToastProps = {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
};

/**
 * Confirmation for a completed action. It sits above the tab bar on a phone,
 * where a thumb is already resting, and top right on wide screens where it does
 * not cover the content being edited.
 */
export function NoticeToast({ type, message, onDismiss }: NoticeToastProps) {
  const isError = type === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-notice-in fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[80] flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur",
        "sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-auto sm:max-w-sm",
        "md:bottom-auto",
        isError
          ? "border-destructive/50 bg-card/95 text-foreground"
          : "border-primary/45 bg-card/95 text-foreground",
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 h-5 w-5 shrink-0", isError ? "text-destructive" : "text-primary")}
      />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-muted-foreground transition hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
