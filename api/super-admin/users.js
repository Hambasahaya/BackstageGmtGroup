import { json } from "../meta/_meta-client.js";
import { authenticate, authorizeSuperAdmin } from "../onboarding/_auth-helper.js";
import { readUsers, writeUsers } from "./users/_store.js";

const VALID_ROLES = ["user", "agent", "sales", "marketing", "super_admin"];

async function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    request.on("error", () => resolve({}));
  });
}

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  // 1. Authenticate & Authorize
  const currentUser = await authenticate(request, response);
  if (!currentUser) return;

  const isAuthorized = authorizeSuperAdmin(currentUser, response);
  if (!isAuthorized) return;

  // 2. Parse URL and Params
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const idStr = requestUrl.searchParams.get("id");
  const action = requestUrl.searchParams.get("action");
  const id = idStr ? Number(idStr) : null;

  const users = await readUsers();

  // 3. Handle GET Methods
  if (request.method === "GET") {
    if (id !== null && !isNaN(id)) {
      // Get User Detail: GET /api/super-admin/users/:id
      const user = users.find((u) => Number(u.id) === id);
      if (!user) {
        return json(response, 404, { message: "user not found" });
      }
      return json(response, 200, { user });
    }

    // Get All Users: GET /api/super-admin/users
    let filteredUsers = [...users];

    // Filter by Search (name, email, phone_number)
    const search = requestUrl.searchParams.get("search");
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      filteredUsers = filteredUsers.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone_number && u.phone_number.includes(q))
      );
    }

    // Filter by Role
    const roleParam = requestUrl.searchParams.get("role");
    if (roleParam && roleParam.trim().length > 0 && roleParam !== "all") {
      filteredUsers = filteredUsers.filter((u) => u.role === roleParam.trim());
    }

    // Filter by is_suspended
    const suspendedParam = requestUrl.searchParams.get("is_suspended");
    if (suspendedParam !== null && suspendedParam !== undefined && suspendedParam !== "all" && suspendedParam !== "") {
      const isSuspended = suspendedParam === "true";
      filteredUsers = filteredUsers.filter((u) => u.is_suspended === isSuspended);
    }

    // Pagination logic
    const pageParam = Number(requestUrl.searchParams.get("page")) || 1;
    const limitParam = Number(requestUrl.searchParams.get("limit")) || 10;

    const page = Math.max(1, pageParam);
    const limit = Math.min(100, Math.max(1, limitParam));
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const startIndex = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

    return json(response, 200, {
      users: paginatedUsers,
      pagination: {
        current_page: page,
        limit: limit,
        total_items: totalItems,
        total_pages: totalPages,
      },
    });
  }

  // 4. Handle PUT Methods
  if (request.method === "PUT") {
    if (id === null || isNaN(id)) {
      return json(response, 400, { message: "valid user ID is required" });
    }

    const userIndex = users.findIndex((u) => Number(u.id) === id);
    if (userIndex === -1) {
      return json(response, 404, { message: "user not found" });
    }

    const body = await parseBody(request);

    // C. Suspend / Unsuspend Account: PUT /api/super-admin/users/:id/suspend
    if (action === "suspend" || requestUrl.pathname.endsWith("/suspend")) {
      if (typeof body.is_suspended !== "boolean") {
        return json(response, 400, { message: "is_suspended (boolean) is required" });
      }

      const isSuspended = body.is_suspended;
      users[userIndex].is_suspended = isSuspended;
      users[userIndex].updated_at = new Date().toISOString();

      await writeUsers(users);

      const messageText = isSuspended
        ? "user account has been suspended"
        : "user account suspension has been lifted";

      return json(response, 200, {
        message: messageText,
        user: {
          id: users[userIndex].id,
          name: users[userIndex].name,
          email: users[userIndex].email,
          is_suspended: users[userIndex].is_suspended,
        },
      });
    }

    // D. Update User Role: PUT /api/super-admin/users/:id/role
    if (action === "role" || requestUrl.pathname.endsWith("/role")) {
      const newRole = body.role;
      if (!newRole || !VALID_ROLES.includes(newRole)) {
        return json(response, 400, {
          message: `invalid role. Valid choices: ${VALID_ROLES.join(", ")}`,
        });
      }

      users[userIndex].role = newRole;
      users[userIndex].updated_at = new Date().toISOString();

      await writeUsers(users);

      return json(response, 200, {
        message: "user role updated successfully",
        user: {
          id: users[userIndex].id,
          name: users[userIndex].name,
          role: users[userIndex].role,
        },
      });
    }

    return json(response, 400, { message: "invalid action. Specify suspend or role" });
  }

  return json(response, 451, { message: "Method not allowed" });
}
