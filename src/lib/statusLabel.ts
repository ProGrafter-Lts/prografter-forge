/**
 * Convert a snake_case database status enum into a presentable label.
 * Examples:
 *  in_progress -> "In Progress"
 *  awaiting_quotes -> "Awaiting Quotes"
 *  open -> "Open"
 */
export const formatStatusLabel = (status?: string | null): string => {
  if (!status) return "—";
  return status
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

/** Title-case a freeform string ("electrical" -> "Electrical", "kitchen renovation" -> "Kitchen Renovation"). */
export const titleCase = (value?: string | null): string => {
  if (!value) return "—";
  return value
    .toString()
    .split(/\s+|_/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};
