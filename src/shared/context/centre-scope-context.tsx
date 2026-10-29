"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ScopeCentre } from "@/types/centre-scope";

interface CentreScopeContextType {
  selectedCentre: ScopeCentre;
  centres: ScopeCentre[];
  isAllCentres: boolean;
  filterByCentre: <T extends { centreCode?: string; centreId?: string }>(items: T[]) => T[];
}

const CentreScopeContext = createContext<CentreScopeContextType | null>(null);

export function CentreScopeProvider({
  children,
  initialCentres,
  initialSelected,
}: {
  children: React.ReactNode;
  initialCentres: ScopeCentre[];
  initialSelected: ScopeCentre;
}) {
  const [selectedCentre, setSelectedCentreState] = useState<ScopeCentre>(initialSelected);
  const [centres] = useState<ScopeCentre[]>(initialCentres);

  useEffect(() => {
    setSelectedCentreState(initialSelected);
  }, [initialSelected]);

  const isAllCentres = selectedCentre.id === "all" || selectedCentre.code === "ALL";

  const filterByCentre = <T extends { centreCode?: string; centreId?: string }>(items: T[]): T[] => {
    if (isAllCentres) return items;
    return items.filter((item) => {
      if (item.centreCode) return item.centreCode === selectedCentre.code;
      if (item.centreId) return item.centreId === selectedCentre.id;
      return true;
    });
  };

  return (
    <CentreScopeContext.Provider
      value={{
        selectedCentre,
        centres,
        isAllCentres,
        filterByCentre,
      }}
    >
      {children}
    </CentreScopeContext.Provider>
  );
}

export function useCentreScope() {
  const context = useContext(CentreScopeContext);
  if (!context) {
    return {
      selectedCentre: { id: "all", code: "ALL", name: "All Medical Centres", city: "All Locations" } as ScopeCentre,
      centres: [] as ScopeCentre[],
      isAllCentres: true,
      filterByCentre: <T extends { centreCode?: string; centreId?: string }>(items: T[]) => items,
    };
  }
  return context;
}
