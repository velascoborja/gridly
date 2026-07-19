"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompletionLockButtonProps {
  completed: boolean;
  pending?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  completeLabel: string;
  reopenLabel: string;
  animateConfirmation?: boolean;
  onConfirmationAnimationEnd?: () => void;
  showText?: boolean;
  actionSize?: boolean;
  className?: string;
}

export function CompletionLockIcon({ completed, animateConfirmation = false }: { completed: boolean; animateConfirmation?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="16" r="1" />
      <rect x="3" y="10" width="18" height="12" rx="2" />
      <path
        data-slot="completion-lock-shackle"
        d="M7 10V7a5 5 0 0 1 10 0v3"
        className={cn(
          completed ? "completion-lock-shackle-closed" : "completion-lock-shackle-open",
          animateConfirmation && (completed ? "animate-lock-close" : "animate-lock-open"),
          "motion-reduce:animate-none"
        )}
      />
    </svg>
  );
}

export function CompletionLockButton({
  completed,
  pending = false,
  disabled = false,
  onToggle,
  completeLabel,
  reopenLabel,
  animateConfirmation = false,
  onConfirmationAnimationEnd,
  showText = false,
  actionSize = false,
  className,
}: CompletionLockButtonProps) {
  const label = completed ? reopenLabel : completeLabel;

  useEffect(() => {
    if (
      !animateConfirmation
      || !onConfirmationAnimationEnd
      || !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const frame = window.requestAnimationFrame(onConfirmationAnimationEnd);
    return () => window.cancelAnimationFrame(frame);
  }, [animateConfirmation, onConfirmationAnimationEnd]);

  return (
    <Button
      type="button"
      size={showText ? "sm" : actionSize ? "icon-sm" : "icon-xs"}
      variant="ghost"
      className={cn(
        "relative shrink-0 overflow-visible transition-[color,background-color,box-shadow] duration-200 motion-reduce:transition-none",
        showText
          ? "h-7 gap-1.5 px-2 text-[11px]"
          : actionSize
            ? "h-9 w-9"
            : "h-7 w-7",
        completed
          ? "bg-emerald-500/10 text-emerald-700 shadow-[inset_0_0_0_1px_rgb(21_190_83_/_0.18)] hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-300"
          : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
        pending && "cursor-wait",
        className
      )}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      disabled={disabled || pending || animateConfirmation}
      aria-label={label}
      title={label}
      aria-pressed={completed}
      aria-busy={pending}
    >
      {pending ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary motion-reduce:animate-none" />
      ) : (
        <span
          onAnimationEnd={() => {
            if (animateConfirmation) onConfirmationAnimationEnd?.();
          }}
        >
          <CompletionLockIcon completed={completed} animateConfirmation={animateConfirmation} />
        </span>
      )}
      {showText ? <span>{label}</span> : null}
    </Button>
  );
}
