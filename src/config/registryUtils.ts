// ─────────────────────────────────────────────────────────────────────────────
// Registry Utils
//
// Merges internal + external entries, deduplicates, groups by category,
// and sorts within each group. Consumed by PrototypeIndex at runtime.
// ─────────────────────────────────────────────────────────────────────────────

import { PROTOTYPE_REGISTRY, CATEGORY_ORDER } from './prototypeRegistry';
import type { PrototypeEntry, PrototypeCategory } from './prototypeRegistry';
import { EXTERNAL_PROTOTYPE_LINKS } from './externalPrototypeLinks';

export type GroupedEntries = {
  category: PrototypeCategory;
  entries: (PrototypeEntry & { isExternal: boolean })[];
};

// Merge, tag each entry as internal/external, deduplicate by URL.
function mergeRegistry(): (PrototypeEntry & { isExternal: boolean })[] {
  const seen = new Set<string>();
  const result: (PrototypeEntry & { isExternal: boolean })[] = [];

  for (const entry of PROTOTYPE_REGISTRY) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    result.push({ ...entry, isExternal: false });
  }

  for (const entry of EXTERNAL_PROTOTYPE_LINKS) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    result.push({ ...entry, isExternal: true });
  }

  return result;
}

// Group by category, preserving CATEGORY_ORDER. Unknown categories go last.
export function getGroupedRegistry(): GroupedEntries[] {
  const all = mergeRegistry();

  const map = new Map<PrototypeCategory, (PrototypeEntry & { isExternal: boolean })[]>();
  for (const entry of all) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }

  const ordered: GroupedEntries[] = [];

  // Known categories first, in declared order
  for (const cat of CATEGORY_ORDER) {
    const entries = map.get(cat);
    if (entries && entries.length > 0) {
      ordered.push({ category: cat, entries });
      map.delete(cat);
    }
  }

  // Any remaining (ad-hoc) categories
  for (const [category, entries] of map) {
    if (entries.length > 0) ordered.push({ category, entries });
  }

  return ordered;
}

// External-only group, for a dedicated Vercel section
export function getExternalGroup(): GroupedEntries | null {
  const all = mergeRegistry();
  const external = all.filter(e => e.isExternal);
  if (external.length === 0) return null;
  return { category: 'Vercel Hosted', entries: external };
}

// Flat list matching a tag
export function getByTag(tag: string): (PrototypeEntry & { isExternal: boolean })[] {
  return mergeRegistry().filter(e => e.tags?.includes(tag));
}

// Total counts for the header stat
export function getRegistryCounts() {
  const all = mergeRegistry();
  return {
    total: all.length,
    active: all.filter(e => e.url !== '#').length,
    wip: all.filter(e => e.status === 'WIP').length,
    external: all.filter(e => e.isExternal).length,
  };
}
