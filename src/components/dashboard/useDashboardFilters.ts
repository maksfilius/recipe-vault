"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { selectLibraryRecipes } from "@/src/lib/dashboard-library";
import type { Recipe } from "@/src/types/recipe";

export function useDashboardFilters(allRecipes: Recipe[], importDraftId: string | null) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const filteredRecipes = useMemo(() => selectLibraryRecipes(allRecipes, query), [allRecipes, query]);

  const updateQuery = useCallback((updates: Record<string, string | null>, replace = false) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const next = params.toString();
    const href = next ? `${pathname}?${next}` : pathname;
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history[replace ? "replaceState" : "pushState"](null, "", href);
    }
  }, [pathname]);

  useEffect(() => {
    if (searchParams.get("importDraft") !== importDraftId) updateQuery({ importDraft: importDraftId }, true);
  }, [importDraftId, searchParams, updateQuery]);

  const clearSearch = () => updateQuery({ q: null, collections: null, tags: null, sort: null });

  return { searchTerm: query, filteredRecipes, clearAllFilters: clearSearch };
}
