"use client";

import { useState } from "react";
import { LoaderCircle, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompletionLockButtonProps {
  completed: boolean;
  pending?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  completeLabel: string;
  reopenLabel: string;
  showText?: boolean;
  actionSize?: boolean;
  className?: string;
}

export function CompletionLockButton({
  completed,
  pending = false,
  disabled = false,
  onToggle,
  completeLabel,
  reopenLabel,
  showText = false,
  actionSize = false,
  className,
}: CompletionLockButtonProps) {
  const label = completed ? reopenLabel : completeLabel;
  const Icon = completed ? LockKeyhole : LockKeyholeOpen;
  const [hasInteracted, setHasInteracted] = useState(false);

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
        setHasInteracted(true);
        onToggle();
      }}
      disabled={disabled || pending}
      aria-label={label}
      title={label}
      aria-pressed={completed}
      aria-busy={pending}
    >
      <Icon
        key={completed ? "locked" : "open"}
        className={cn(
          "h-3.5 w-3.5 motion-reduce:animate-none",
          hasInteracted && (completed ? "animate-lock-close" : "animate-lock-open"),
          pending && "animate-pulse motion-reduce:animate-none"
        )}
      />
      {showText ? <span>{label}</span> : null}
      {pending ? (
        <LoaderCircle className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-spin text-primary motion-reduce:animate-none" />
      ) : null}
    </Button>
  );
}
