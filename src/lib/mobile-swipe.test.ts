import test from "node:test";
import assert from "node:assert/strict";

test("horizontal swipe direction ignores short or mostly vertical gestures", async () => {
  const { getHorizontalSwipeDirection } = await import(new URL("./mobile-swipe.ts", import.meta.url).href);

  assert.equal(getHorizontalSwipeDirection({ startX: 40, startY: 10, endX: 88, endY: 12 }), null);
  assert.equal(getHorizontalSwipeDirection({ startX: 40, startY: 10, endX: 130, endY: 78 }), null);
});

test("horizontal swipe direction maps left and right swipes", async () => {
  const { getHorizontalSwipeDirection } = await import(new URL("./mobile-swipe.ts", import.meta.url).href);

  assert.equal(getHorizontalSwipeDirection({ startX: 140, startY: 20, endX: 48, endY: 26 }), "next");
  assert.equal(getHorizontalSwipeDirection({ startX: 48, startY: 20, endX: 140, endY: 26 }), "previous");
});
