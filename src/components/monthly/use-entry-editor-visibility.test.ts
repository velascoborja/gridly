import test from "node:test";
import assert from "node:assert/strict";

import {
  getEditorScrollDelta,
  getVisibleViewportBounds,
  shouldAdjustEditorVisibility,
} from "./use-entry-editor-visibility.ts";

test("leaves a fully visible editor in place", () => {
  assert.equal(
    getEditorScrollDelta({ top: 32, bottom: 180 }, { top: 0, bottom: 240 }),
    0
  );
});

test("moves an editor up by the minimum distance when the keyboard hides its bottom", () => {
  assert.equal(
    getEditorScrollDelta({ top: 120, bottom: 260 }, { top: 0, bottom: 220 }),
    56
  );
});

test("moves an editor down by the minimum distance when it is above the visible area", () => {
  assert.equal(
    getEditorScrollDelta({ top: 80, bottom: 180 }, { top: 100, bottom: 400 }),
    -36
  );
});

test("uses the layout viewport when VisualViewport is unavailable", () => {
  assert.deepEqual(getVisibleViewportBounds(undefined, 640), { top: 0, bottom: 640 });
});

test("falls back from incomplete or invalid VisualViewport metrics", () => {
  assert.deepEqual(getVisibleViewportBounds({ offsetTop: 20 }, 600), { top: 0, bottom: 600 });
  assert.deepEqual(getVisibleViewportBounds({ offsetTop: 20, height: 0 }, 600), { top: 0, bottom: 600 });
  assert.equal(getVisibleViewportBounds({ offsetTop: Number.NaN, height: 400 }, 0), null);
});

test("does not adjust visibility after focus leaves the editor", () => {
  const focusedInput = {} as Element;
  const container = { contains: (element: Node | null) => element !== focusedInput };

  assert.equal(shouldAdjustEditorVisibility(container, focusedInput), false);
  assert.equal(shouldAdjustEditorVisibility(container, null), false);
});
