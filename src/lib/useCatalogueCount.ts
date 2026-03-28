"use client";

import { useEffect, useState } from "react";
import { CATALOGUE_UPDATED_EVENT, listCatalogueItems } from "@/lib/localCatalogue";

export function useCatalogueCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(listCatalogueItems().length);
    refresh();
    window.addEventListener(CATALOGUE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CATALOGUE_UPDATED_EVENT, refresh);
  }, []);

  return count;
}
