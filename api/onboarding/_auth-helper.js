import { json } from "../meta/_meta-client.js";

const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function authenticate(request, response) {
  const authHeader = request.headers.authorization || request.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    json(response, 401, { message: "session expired or revoked" });
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      json(response, 401, { message: "session expired or revoked" });
      return null;
    }

    const data = await res.json();
    if (!data.user) {
      json(response, 401, { message: "session expired or revoked" });
      return null;
    }

    return data.user;
  } catch (error) {
    json(response, 401, { message: "session expired or revoked", error: error.message });
    return null;
  }
}

export function authorizeSuperAdmin(user, response) {
  if (user.role !== "super_admin") {
    json(response, 403, { message: "you do not have access to this resource" });
    return false;
  }
  return true;
}

export function authorizeAgentOrUser(user, response) {
  const isAllowedRole = user.role === "agent" || user.role === "user";
  const agentStatus = user.detail_user?.status;
  const isAllowedStatus = agentStatus === "verif" || agentStatus === "official_agent";

  if (!isAllowedRole || !isAllowedStatus) {
    json(response, 403, { message: "you do not have access to this resource" });
    return false;
  }
  return true;
}

export function authorizeAdminOrSalesOrMarketing(user, response) {
  const allowedRoles = ["super_admin", "sales", "marketing"];
  if (!allowedRoles.includes(user?.role)) {
    json(response, 403, { success: false, message: "you do not have access to this resource", error: "you do not have access to this resource" });
    return false;
  }
  return true;
}

