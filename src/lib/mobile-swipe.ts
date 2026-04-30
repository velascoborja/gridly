export type HorizontalSwipeDirection = "previous" | "next";

interface SwipeCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const MIN_HORIZONTAL_DISTANCE = 64;
const MAX_VERTICAL_DISTANCE = 48;

export function getHorizontalSwipeDirection({
  startX,
  startY,
  endX,
  endY,
}: SwipeCoordinates): HorizontalSwipeDirection | null {
  const horizontalDistance = endX - startX;
  const verticalDistance = Math.abs(endY - startY);

  if (Math.abs(horizontalDistance) < MIN_HORIZONTAL_DISTANCE) return null;
  if (verticalDistance > MAX_VERTICAL_DISTANCE) return null;

  return horizontalDistance < 0 ? "next" : "previous";
}
