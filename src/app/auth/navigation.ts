import { getEffectiveRole, roleHomePaths } from "./roles";
import type { UserSession } from "../services/api";

export function getRoleHomePath(user: UserSession | null | undefined) {
  const status = user?.detail_user?.status;
  if (status === "verif") {
    return "/apply-agent";
  }
  if (status === "official_agent") {
    return "/agent-onboarding";
  }

  return roleHomePaths[getEffectiveRole(user)];
}
