export const COMPLETED_LOCK_ERROR = "completed_locked";

export function isCompletionOnlyRequest(
  body: Record<string, unknown>,
  isCompleted: boolean
): boolean {
  if (!isCompleted) return true;

  const keys = Object.keys(body);
  return keys.length === 1 && keys[0] === "isCompleted" && body.isCompleted === false;
}
