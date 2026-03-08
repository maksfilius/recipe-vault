import { formatDistanceToNow } from "date-fns";

export function formatRelativeTime(dateLike?: string) {
  if (!dateLike) {
    return "Unknown";
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}
