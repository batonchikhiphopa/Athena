import { normalizeTag } from "../entryFilters";

export function tagTestIdValue(tag: string) {
  return normalizeTag(tag).replace(/[^\p{L}\p{N}]+/gu, "-") || "tag";
}
