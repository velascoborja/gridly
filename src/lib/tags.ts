export interface TagColor {
  bg: string;
  border: string;
  text: string;
}

export const TAG_COLORS: Record<string, TagColor> = {
  rose:    { bg: "rgba(244, 63, 94, 0.12)",   border: "rgba(244, 63, 94, 0.25)",   text: "#f43f5e" },
  orange:  { bg: "rgba(249, 115, 22, 0.12)",  border: "rgba(249, 115, 22, 0.25)",  text: "#f97316" },
  amber:   { bg: "rgba(234, 179, 8, 0.12)",   border: "rgba(234, 179, 8, 0.25)",   text: "#eab308" },
  emerald: { bg: "rgba(16, 185, 129, 0.12)",  border: "rgba(16, 185, 129, 0.25)",  text: "#10b981" },
  cyan:    { bg: "rgba(6, 182, 212, 0.12)",   border: "rgba(6, 182, 212, 0.25)",   text: "#06b6d4" },
  blue:    { bg: "rgba(59, 130, 246, 0.12)",  border: "rgba(59, 130, 246, 0.25)",  text: "#3b82f6" },
  violet:  { bg: "rgba(139, 92, 246, 0.12)",  border: "rgba(139, 92, 246, 0.25)",  text: "#8b5cf6" },
  pink:    { bg: "rgba(236, 72, 153, 0.12)",  border: "rgba(236, 72, 153, 0.25)",  text: "#ec4899" },
  slate:   { bg: "rgba(100, 116, 139, 0.12)", border: "rgba(100, 116, 139, 0.25)", text: "#64748b" },
};

export const TAG_COLOR_KEYS = Object.keys(TAG_COLORS);
