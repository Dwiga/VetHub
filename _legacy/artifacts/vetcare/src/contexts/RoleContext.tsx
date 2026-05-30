import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useGetMe } from "@workspace/api-client-react";

type ActiveRole = "pet-owner" | "vet";

interface RoleContextValue {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  hasBothRoles: boolean;
  canSwitchToVet: boolean;
  canSwitchToPetOwner: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  activeRole: "pet-owner",
  setActiveRole: () => {},
  hasBothRoles: false,
  canSwitchToVet: false,
  canSwitchToPetOwner: false,
});

const STORAGE_KEY = "vetcare_active_role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const me = useGetMe();
  const user = me.data;

  const isVetApproved = !!(user?.isVet || user?.isVetOwner) && user?.vetStatus === "approved";
  const isPetOwner = !!user?.isPetOwner;
  const hasBothRoles = isVetApproved && isPetOwner;

  const [activeRole, setActiveRoleState] = useState<ActiveRole>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ActiveRole) ?? "pet-owner";
  });

  useEffect(() => {
    if (!me.isLoading && user) {
      const stored = localStorage.getItem(STORAGE_KEY) as ActiveRole | null;
      if (!stored) {
        setActiveRoleState(isVetApproved && !isPetOwner ? "vet" : "pet-owner");
      } else if (stored === "vet" && !isVetApproved) {
        setActiveRoleState("pet-owner");
      } else if (stored === "pet-owner" && !isPetOwner && isVetApproved) {
        setActiveRoleState("vet");
      }
    }
  }, [me.isLoading, isVetApproved, isPetOwner, user]);

  const setActiveRole = useCallback((role: ActiveRole) => {
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEY, role);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        setActiveRole,
        hasBothRoles,
        canSwitchToVet: isVetApproved,
        canSwitchToPetOwner: isPetOwner,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
