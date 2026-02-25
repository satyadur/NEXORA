"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface AssignmentProtectionContextType {
  isAssignmentRoute: boolean;
  enableAssignmentMode: () => void;
  disableAssignmentMode: () => void;
}

const AssignmentProtectionContext = createContext<AssignmentProtectionContextType | undefined>(undefined);

export function AssignmentProtectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAssignmentRoute, setIsAssignmentRoute] = useState(false);

  // Check if current route is an assignment route
  useEffect(() => {
    const isAssignment = pathname?.includes('/student/assignments/') && 
                        (pathname?.endsWith('/start') || pathname?.includes('/start'));
    setIsAssignmentRoute(!!isAssignment);
  }, [pathname]);

  const enableAssignmentMode = () => setIsAssignmentRoute(true);
  const disableAssignmentMode = () => setIsAssignmentRoute(false);

  return (
    <AssignmentProtectionContext.Provider value={{ isAssignmentRoute, enableAssignmentMode, disableAssignmentMode }}>
      {children}
    </AssignmentProtectionContext.Provider>
  );
}

export function useAssignmentProtection() {
  const context = useContext(AssignmentProtectionContext);
  if (context === undefined) {
    throw new Error('useAssignmentProtection must be used within an AssignmentProtectionProvider');
  }
  return context;
}