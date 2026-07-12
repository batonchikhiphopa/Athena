export function excerpt(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function extractTags(text: string) {
  const matches = text.match(/#([а-яёa-z0-9_-]+)/gi) ?? [];
  const normalized = matches.map((item) => item.slice(1).toLowerCase());

  return Array.from(new Set(normalized)).slice(0, 4);
}
