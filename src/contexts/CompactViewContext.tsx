import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CompactViewContextType {
  isCompact: boolean;
  toggleCompact: () => void;
  setCompact: (value: boolean) => void;
}

const CompactViewContext = createContext<CompactViewContextType | undefined>(undefined);

export function CompactViewProvider({ children }: { children: ReactNode }) {
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("compactView");
        return saved ? JSON.parse(saved) : false;
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("compactView", JSON.stringify(isCompact));
      } catch (error) {
        console.error("Failed to save compact view preference:", error);
      }
      
      const root = document.documentElement;
      if (isCompact) {
        root.classList.add("compact-view");
      } else {
        root.classList.remove("compact-view");
      }
    }
  }, [isCompact]);

  const toggleCompact = () => {
    setIsCompact((prev) => !prev);
  };

  const setCompact = (value: boolean) => {
    setIsCompact(value);
  };

  return (
    <CompactViewContext.Provider value={{ isCompact, toggleCompact, setCompact }}>
      {children}
    </CompactViewContext.Provider>
  );
}

export function useCompactView() {
  const context = useContext(CompactViewContext);
  if (context === undefined) {
    throw new Error("useCompactView must be used within a CompactViewProvider");
  }
  return context;
}



