"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

const KEYBOARD_INSET_VAR = "--sheet-keyboard-inset"
const VIEWPORT_HEIGHT_VAR = "--sheet-viewport-height"
const FOCUS_REVEAL_MARGIN = 16

function isTextEntry(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    (element instanceof HTMLInputElement &&
      !["button", "checkbox", "radio", "range", "submit", "reset"].includes(element.type)) ||
    (element instanceof HTMLElement && element.isContentEditable)
  )
}

/** Scrolls only the sheet body so the focused field sits inside the visible part of the sheet. */
function revealInSheetBody(element: HTMLElement) {
  const scroller = element.closest<HTMLElement>('[data-slot="sheet-body"]')
  if (!scroller) return
  const bounds = scroller.getBoundingClientRect()
  const target = element.getBoundingClientRect()
  if (target.bottom > bounds.bottom - FOCUS_REVEAL_MARGIN) {
    scroller.scrollTop += target.bottom - bounds.bottom + FOCUS_REVEAL_MARGIN
  } else if (target.top < bounds.top + FOCUS_REVEAL_MARGIN) {
    scroller.scrollTop -= bounds.top + FOCUS_REVEAL_MARGIN - target.top
  }
}

/**
 * Mobile browsers overlay the on-screen keyboard on the layout viewport, so a sheet pinned to
 * `bottom: 0` hides its lower fields behind it. This keeps the sheet above the keyboard and
 * sized to the visible viewport, then scrolls the focused field into view.
 */
function followVisualViewport(popup: HTMLElement | null) {
  const viewport = typeof window === "undefined" ? undefined : window.visualViewport
  if (!popup || !viewport) return

  let frame = 0
  const revealFocused = () => {
    const focused = document.activeElement
    if (isTextEntry(focused) && popup.contains(focused)) revealInSheetBody(focused)
  }
  const sync = () => {
    const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    popup.style.setProperty(KEYBOARD_INSET_VAR, `${keyboardInset}px`)
    popup.style.setProperty(VIEWPORT_HEIGHT_VAR, `${viewport.height}px`)
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(revealFocused)
  }
  const onFocusIn = (event: FocusEvent) => {
    if (!isTextEntry(event.target as Element | null)) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(revealFocused)
  }

  sync()
  viewport.addEventListener("resize", sync)
  viewport.addEventListener("scroll", sync)
  popup.addEventListener("focusin", onFocusIn)
  return () => {
    cancelAnimationFrame(frame)
    viewport.removeEventListener("resize", sync)
    viewport.removeEventListener("scroll", sync)
    popup.removeEventListener("focusin", onFocusIn)
  }
}

/** Bottom sheet anchored to the viewport's lower edge, used for mobile-only secondary panels. */
function SheetContent({
  className,
  children,
  closeLabel,
  ...props
}: SheetPrimitive.Popup.Props & { closeLabel: string }) {
  return (
    <SheetPrimitive.Portal data-slot="sheet-portal">
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 isolate z-50 bg-overlay/35 opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] supports-backdrop-filter:backdrop-blur-xs data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-200 data-ending-style:ease-in motion-reduce:transition-none"
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        ref={followVisualViewport}
        className={cn(
          "fixed inset-x-0 bottom-[var(--sheet-keyboard-inset,0px)] z-50 flex max-h-[calc(var(--sheet-viewport-height,100dvh)*0.88)] flex-col rounded-t-2xl border-t border-border/70 bg-background text-sm text-foreground shadow-sheet outline-none translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform data-starting-style:translate-y-full data-ending-style:translate-y-full data-ending-style:duration-200 data-ending-style:ease-in motion-reduce:transition-none",
          className
        )}
        {...props}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border" />
        {children}
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            />
          }
        >
          <XIcon />
          <span className="sr-only">{closeLabel}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex shrink-0 flex-col gap-1 px-4 pt-2 pb-3 pr-12", className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle }
