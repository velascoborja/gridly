# Design Spec: Scrollable Month Navigation

Implementing a horizontally scrollable, center-aligned month navigation for mobile views in the `NavSelectors` component.

## Problem
On mobile devices, the 12-month navigation list is cropped because it exceeds the screen width. Users cannot easily see or access all months, and there is no visual indicator or automatic centering on the currently active month.

## Proposed Solution
Enhance the month navigation in `NavSelectors` to support horizontal scrolling with snap points and automatic centering on the active month using React refs and `scrollIntoView`.

### 1. UI Enhancements (CSS)
- **Container**:
    - Add `overflow-x-auto` (already present, but ensure it works well).
    - Add `snap-x snap-mandatory` for smooth snapping behavior.
    - Use `scrollbar-hide` (or custom CSS) to keep the UI clean on mobile.
    - Add horizontal padding to the container to allow the first/last months to center properly.
- **Items (Month Links)**:
    - Add `snap-center` to each link to ensure they stop at the middle of the container when scrolling.
    - Ensure `shrink-0` (already present) is maintained so items don't compress.

### 2. Logic Enhancements (React)
- **Refs**: Use `useRef<HTMLDivElement>(null)` for the scrollable container.
- **Centering Logic**:
    - Use `useEffect` with `[currentMonth, view]` as dependencies.
    - When the component mounts or the month changes:
        1. Find the active element within the container (using `[aria-current="page"]`).
        2. Call `activeElement.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' })`.
        3. Use `instant` behavior for the initial load to avoid jarring transitions, and potentially `smooth` if we want a transition effect on navigation.

### 3. Edge Case Handling
- **First/Last Month**: The container should have enough padding/margins to allow the first and last months to be centered.
- **Desktop View**: Ensure these changes don't negatively impact the desktop layout (where all months usually fit). Use responsive prefixes (`md:snap-none`, etc.) if necessary.

## Success Criteria
- [ ] All 12 months are accessible via horizontal scroll on mobile.
- [ ] The active month is centered in the viewport upon page load.
- [ ] Scrolling feels natural and snaps to individual months.
- [ ] Desktop layout remains clean and functional.

## Dependencies
- `NavSelectors` component
- `MONTH_NAMES` utility
- Tailwind CSS
