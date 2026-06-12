import { getStoredUser, type ApiRole, type UserSession } from "../services/api";
import type { AgentApplicationStatus } from "../services/api";

export type AppRole = ApiRole;

export const roleStorageKey = "gmt-current-role";

export const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  agent: "Agent",
  sales: "Sales",
  user: "User",
  marketing: "Marketing",
};

export const roleHomePaths: Record<AppRole, string> = {
  super_admin: "/dashboard",
  agent: "/agent-onboarding",
  sales: "/sales-orders",
  user: "/apply-agent",
  marketing: "/",
};

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "agent" || role === "sales" || role === "super_admin" || role === "user" || role === "marketing") {
    return role;
  }

  return "user";
}

export function getEffectiveRole(user: UserSession | null | undefined): AppRole {
  if (user?.detail_user?.status === "official_agent") {
    return "agent";
  }

  return normalizeRole(user?.role);
}

export function getCurrentRole(): AppRole {
  if (typeof window === "undefined") {
    return "super_admin";
  }

  const storedUser = getStoredUser();

  if (storedUser) {
    return getEffectiveRole(storedUser);
  }

  return normalizeRole(window.localStorage.getItem(roleStorageKey));
}

export function getCurrentAgentStatus(): AgentApplicationStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  return getStoredUser()?.detail_user?.status ?? null;
}

export function canAccessRole(currentRole: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(currentRole);
}
