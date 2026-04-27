export function todayDateOnly() {
  return toDateOnly(new Date());
}

export function formatLongDate(dateOnly: string) {
  return parseDateOnly(dateOnly).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateOnly: string) {
  return parseDateOnly(dateOnly).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateOnly: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}
