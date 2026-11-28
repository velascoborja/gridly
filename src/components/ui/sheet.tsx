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

/**
 * Scrolls only the sheet body so the focused field sits in the part of the sheet that is still
 * visible, i.e. between the top of the body and the top edge of the on-screen keyboard.
 */
function revealInSheetBody(element: HTMLElement, viewport: VisualViewport) {
  const scroller = element.closest<HTMLElement>('[data-slot="sheet-body"]')
  if (!scroller) return
  const bounds = scroller.getBoundingClientRect()
  const visibleTop = Math.max(bounds.top, viewport.offsetTop) + FOCUS_REVEAL_MARGIN
  const visibleBottom =
    Math.min(bounds.bottom, viewport.offsetTop + viewport.height) - FOCUS_REVEAL_MARGIN
  const target = element.getBoundingClientRect()
  if (target.bottom > visibleBottom) {
    scroller.scrollTop += target.bottom - visibleBottom
  } else if (target.top < visibleTop) {
    scroller.scrollTop -= visibleTop - target.top
  }
}

/**
 * Mobile browsers draw the on-screen keyboard over the layout viewport, so the lower part of a
 * sheet pinned to `bottom: 0` ends up behind it. The sheet stays where it is; instead the body
 * gets extra bottom padding equal to the covered height, so every field can be scrolled above
 * the keyboard, and the focused field is scrolled into that visible area.
 */
function followVisualViewport(popup: HTMLElement | null) {
  const viewport = typeof window === "undefined" ? undefined : window.visualViewport
  if (!popup || !viewport) return

  let frame = 0
  const revealFocused = () => {
    const focused = document.activeElement
    if (isTextEntry(focused) && popup.contains(focused)) revealInSheetBody(focused, viewport)
  }
  const sync = () => {
    // offsetTop/offsetHeight ignore the enter/exit translate, so this is the sheet's resting bottom.
    const sheetBottom = popup.offsetTop + popup.offsetHeight
    const covered = sheetBottom - (viewport.offsetTop + viewport.height)
    popup.style.setProperty(KEYBOARD_INSET_VAR, `${Math.max(0, Math.round(covered))}px`)
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
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-border/70 bg-background text-sm text-foreground shadow-sheet outline-none translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform data-starting-style:translate-y-full data-ending-style:translate-y-full data-ending-style:duration-200 data-ending-style:ease-in motion-reduce:transition-none",
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
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(max(1rem,env(safe-area-inset-bottom))+var(--sheet-keyboard-inset,0px))]",
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
