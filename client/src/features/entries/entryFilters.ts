import type { EntryView } from "../../types";

export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

export function getEntryTagSet(entry: EntryView): Set<string> {
  return new Set(entry.tags.map(normalizeTag).filter(Boolean));
}

export function getAvailableTags(
  entries: EntryView[],
): Array<{ tag: string; count: number }> {
  const tagsByNormalizedValue = new Map<
    string,
    { tag: string; count: number }
  >();

  for (const entry of entries) {
    const countedForEntry = new Set<string>();

    for (const rawTag of entry.tags) {
      const normalizedTag = normalizeTag(rawTag);
      if (!normalizedTag || countedForEntry.has(normalizedTag)) continue;

      countedForEntry.add(normalizedTag);

      const existing = tagsByNormalizedValue.get(normalizedTag);

      if (existing) {
        existing.count += 1;
      } else {
        tagsByNormalizedValue.set(normalizedTag, {
          tag: rawTag.trim().replace(/^#+/, ""),
          count: 1,
        });
      }
    }
  }

  return Array.from(tagsByNormalizedValue.values()).sort((left, right) =>
    left.tag.localeCompare(right.tag),
  );
}

export function entryMatchesIncludedTags(
  entry: EntryView,
  includedTags: string[],
): boolean {
  if (includedTags.length === 0) return true;

  const entryTags = getEntryTagSet(entry);

  return includedTags.every((tag) => entryTags.has(normalizeTag(tag)));
}

export function entryMatchesExcludedTags(
  entry: EntryView,
  excludedTags: string[],
): boolean {
  if (excludedTags.length === 0) return true;

  const entryTags = getEntryTagSet(entry);

  return excludedTags.every((tag) => !entryTags.has(normalizeTag(tag)));
}

export function filterEntriesByTags(
  entries: EntryView[],
  includedTags: string[],
  excludedTags: string[] = [],
): EntryView[] {
  return entries.filter(
    (entry) =>
      entryMatchesIncludedTags(entry, includedTags) &&
      entryMatchesExcludedTags(entry, excludedTags),
  );
}

export function pruneUnavailableTags(
  selectedTags: string[],
  availableTags: Array<{ tag: string; count: number }>,
): string[] {
  const availableTagSet = new Set(
    availableTags.map(({ tag }) => normalizeTag(tag)),
  );

  return selectedTags.filter((tag) => availableTagSet.has(normalizeTag(tag)));
}
