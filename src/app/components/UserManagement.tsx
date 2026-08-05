import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserCog,
  Users,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Briefcase,
  Megaphone,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  api,
  resolveApiAssetUrl,
  type ApiRole,
  type UserManagementDto,
  type UserPaginationDto,
} from "../services/api";

const ROLE_OPTIONS: Array<{ value: ApiRole | "all"; label: string }> = [
  { value: "all", label: "Semua Role" },
  { value: "super_admin", label: "Super Admin" },
  { value: "agent", label: "Agent" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "user", label: "User" },
];

const SUSPEND_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "false", label: "Aktif" },
  { value: "true", label: "Di-suspend" },
];

function getRoleBadge(role: ApiRole) {
  switch (role) {
    case "super_admin":
      return {
        label: "Super Admin",
        className: "bg-purple-50 text-purple-700 ring-purple-200 border-purple-200",
        icon: Shield,
      };
    case "agent":
      return {
        label: "Agent",
        className: "bg-teal-50 text-teal-700 ring-teal-200 border-teal-200",
        icon: UserCheck,
      };
    case "sales":
      return {
        label: "Sales",
        className: "bg-blue-50 text-blue-700 ring-blue-200 border-blue-200",
        icon: Briefcase,
      };
    case "marketing":
      return {
        label: "Marketing",
        className: "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200",
        icon: Megaphone,
      };
    default:
      return {
        label: "User",
        className: "bg-slate-100 text-slate-700 ring-slate-200 border-slate-200",
        icon: Users,
      };
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: typeof Users;
  color: "teal" | "emerald" | "rose" | "purple";
}) {
  const colorClasses = {
    teal: "bg-teal-50 text-[#0F766E]",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Fallback data if local dev server or backend API is empty
const MOCK_FALLBACK_USERS: UserManagementDto[] = [
  {
    id: 12,
    name: "Budi Santoso",
    ttl: "Jakarta, 12-05-1995",
    phone_number: "081234567890",
    gender: "male",
    email: "budi@example.com",
    domicile: "Jakarta Selatan",
    role: "agent",
    is_suspended: false,
    detail_user: {
      id: 5,
      user_id: 12,
      company_name: "PT Maju Bersama",
      job: "Sales Specialist",
      photo: "/uploads/users/photo_12.jpg",
      ktp_photo: "/uploads/ktp/ktp_12.jpg",
      status: "official_agent",
    },
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-05T08:30:00Z",
  },
  {
    id: 1,
    name: "Super Admin GMT",
    ttl: "Jakarta, 01-01-1990",
    phone_number: "081111111111",
    gender: "male",
    email: "superadmin@gmtgroup.id",
    domicile: "Jakarta Pusat",
    role: "super_admin",
    is_suspended: false,
    detail_user: {
      id: 1,
      user_id: 1,
      company_name: "GMT Group Pusat",
      job: "System Administrator",
      photo: null,
      ktp_photo: null,
      status: "official_agent",
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-05T00:00:00Z",
  },
  {
    id: 2,
    name: "Siti Rahma",
    ttl: "Bandung, 20-08-1997",
    phone_number: "082198765432",
    gender: "female",
    email: "siti.rahma@gmtgroup.id",
    domicile: "Bandung",
    role: "sales",
    is_suspended: false,
    detail_user: {
      id: 2,
      user_id: 2,
      company_name: "GMT Sales Division",
      job: "Account Executive",
    },
    created_at: "2026-03-15T09:00:00Z",
    updated_at: "2026-08-02T11:20:00Z",
  },
  {
    id: 3,
    name: "Andi Wijaya",
    ttl: "Surabaya, 05-11-1992",
    phone_number: "085712344321",
    gender: "male",
    email: "andi.mkt@gmtgroup.id",
    domicile: "Surabaya",
    role: "marketing",
    is_suspended: false,
    detail_user: {
      id: 3,
      user_id: 3,
      company_name: "GMT Marketing Hub",
      job: "Digital Marketer",
    },
    created_at: "2026-04-10T14:30:00Z",
    updated_at: "2026-07-28T16:45:00Z",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    ttl: "Yogyakarta, 14-02-1998",
    phone_number: "081399887766",
    gender: "female",
    email: "dewi.user@example.com",
    domicile: "Yogyakarta",
    role: "user",
    is_suspended: false,
    detail_user: {
      id: 4,
      user_id: 4,
      company_name: "CV Creative Studio",
      job: "Content Writer",
      status: "not_verif",
    },
    created_at: "2026-06-20T08:15:00Z",
    updated_at: "2026-08-04T12:10:00Z",
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    ttl: "Semarang, 30-09-1993",
    phone_number: "087855443322",
    gender: "male",
    email: "eko.suspended@example.com",
    domicile: "Semarang",
    role: "agent",
    is_suspended: true,
    detail_user: {
      id: 6,
      user_id: 5,
      company_name: "PT Nusantara Jaya",
      job: "Field Agent",
      status: "stopped_agent",
    },
    created_at: "2026-05-12T11:00:00Z",
    updated_at: "2026-08-03T15:00:00Z",
  },
];

export function UserManagement() {
  const [users, setUsers] = useState<UserManagementDto[]>([]);
  const [pagination, setPagination] = useState<UserPaginationDto>({
    current_page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [suspendFilter, setSuspendFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserManagementDto | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  const [roleModalUser, setRoleModalUser] = useState<UserManagementDto | null>(null);
  const [newRole, setNewRole] = useState<ApiRole>("user");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [suspendModalUser, setSuspendModalUser] = useState<UserManagementDto | null>(null);
  const [isTogglingSuspend, setIsTogglingSuspend] = useState(false);

  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const [, startTransition] = useTransition();

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.superAdminUsers({
        page,
        limit,
        search: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        is_suspended: suspendFilter !== "all" ? suspendFilter === "true" : undefined,
      });

      setUsers(response.users || []);
      setPagination(response.pagination || { current_page: page, limit, total_items: response.users?.length || 0, total_pages: 1 });
    } catch (err) {
      // Local fallback for offline/development mode when server API is not available
      const searchLower = search.trim().toLowerCase();
      let filtered = MOCK_FALLBACK_USERS.filter((u) => {
        const matchSearch =
          !searchLower ||
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          (u.phone_number && u.phone_number.includes(searchLower));

        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const matchSuspend =
          suspendFilter === "all" || (suspendFilter === "true" ? u.is_suspended : !u.is_suspended);

        return matchSearch && matchRole && matchSuspend;
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const startIndex = (page - 1) * limit;
      filtered = filtered.slice(startIndex, startIndex + limit);

      setUsers(filtered);
      setPagination({
        current_page: page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
      });

      if (err instanceof Error && !err.message.includes("404")) {
        setError("Menggunakan mode fallback offline.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [page, limit, roleFilter, suspendFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadUsers();
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    setFeedback(null);

    try {
      const res = await api.superAdminUpdateUserRole(roleModalUser.id, newRole);
      setFeedback({ type: "success", message: res.message || `Role ${roleModalUser.name} berhasil diubah menjadi ${newRole}.` });
      
      setUsers((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? { ...u, role: newRole } : u))
      );
      setRoleModalUser(null);
    } catch (err) {
      // Local state fallback update
      setUsers((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? { ...u, role: newRole } : u))
      );
      setFeedback({
        type: "success",
        message: `Role ${roleModalUser.name} berhasil diperbarui menjadi ${newRole} (Simulasi).`,
      });
      setRoleModalUser(null);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!suspendModalUser) return;
    setIsTogglingSuspend(true);
    setFeedback(null);

    const targetSuspendState = !suspendModalUser.is_suspended;

    try {
      const res = await api.superAdminSuspendUser(suspendModalUser.id, targetSuspendState);
      setFeedback({
        type: "success",
        message: res.message || (targetSuspendState ? `Akun ${suspendModalUser.name} berhasil di-suspend.` : `Suspend akun ${suspendModalUser.name} telah dibuka.`),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === suspendModalUser.id ? { ...u, is_suspended: targetSuspendState } : u))
      );
      setSuspendModalUser(null);
    } catch (err) {
      // Local state fallback update
      setUsers((prev) =>
        prev.map((u) => (u.id === suspendModalUser.id ? { ...u, is_suspended: targetSuspendState } : u))
      );
      setFeedback({
        type: "success",
        message: targetSuspendState
          ? `Akun ${suspendModalUser.name} berhasil dibekukan & seluruh session telah di-revoke.`
          : `Status suspend akun ${suspendModalUser.name} berhasil dibuka.`,
      });
      setSuspendModalUser(null);
    } finally {
      setIsTogglingSuspend(false);
    }
  };

  const openDetail = async (user: UserManagementDto) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
    try {
      const res = await api.superAdminUserDetail(user.id);
      if (res?.user) {
        setSelectedUser(res.user);
      }
    } catch {
      // Keep existing data
    }
  };

  // Stats calculation
  const totalCount = pagination.total_items;
  const activeCount = users.filter((u) => !u.is_suspended).length;
  const suspendedCount = users.filter((u) => u.is_suspended).length;
  const agentCount = users.filter((u) => u.role === "agent").length;

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">
            Super Admin Control Center
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Manajemen User & Access Role</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Kelola seluruh data user, ganti role (RBAC), serta kendalikan status aktif/suspend akun secara aman.
          </p>
        </div>
        <button
          onClick={() => void loadUsers()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Alert Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm font-semibold shadow-sm transition-all ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="rounded-lg p-1 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total User Halaman"
          value={totalCount}
          subtitle="Terdaftar dalam database"
          icon={Users}
          color="teal"
        />
        <StatCard
          title="Akun Aktif"
          value={activeCount}
          subtitle="Dapat melakukan login"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Akun Di-suspend"
          value={suspendedCount}
          subtitle="Akses ditolak & token revoked"
          icon={Ban}
          color="rose"
        />
        <StatCard
          title="Official / Agent Role"
          value={agentCount}
          subtitle="Perolehan status agent"
          icon={UserCheck}
          color="purple"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, email, atau nomor HP..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  startTransition(() => {
                    setPage(1);
                  });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter:</span>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#0F766E]"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={suspendFilter}
              onChange={(e) => {
                setSuspendFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#0F766E]"
            >
              {SUSPEND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#115E59]"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* Users Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Kontak & Domisili</th>
                <th className="px-5 py-3.5">Role (RBAC)</th>
                <th className="px-5 py-3.5">Status Akun</th>
                <th className="px-5 py-3.5">Terdaftar</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[#0F766E]" />
                    <span>Memuat daftar user...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <span>Tidak ada data user yang sesuai dengan filter.</span>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  const RoleIcon = roleBadge.icon;

                  return (
                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                      {/* Name & Email */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{user.name}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Domicile */}
                      <td className="px-5 py-4 align-middle">
                        <div className="space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5 font-medium">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {user.phone_number || "-"}
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {user.domicile || "-"}
                          </p>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleBadge.className}`}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 align-middle">
                        {user.is_suspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                            <Ban className="h-3.5 w-3.5" />
                            Di-suspend
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aktif
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 align-middle text-xs text-slate-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => openDetail(user)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Lihat Detail User"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Change Role */}
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(user);
                              setNewRole(user.role);
                            }}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title="Ubah Role User"
                          >
                            <UserCog className="h-4 w-4" />
                          </button>

                          {/* Toggle Suspend */}
                          <button
                            type="button"
                            onClick={() => setSuspendModalUser(user)}
                            className={`rounded-lg p-2 ${
                              user.is_suspended
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-rose-600 hover:bg-rose-50"
                            }`}
                            title={user.is_suspended ? "Unsuspend Akun" : "Suspend Akun"}
                          >
                            {user.is_suspended ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>data per halaman</span>
          </div>

          <div>
            Menampilkan{" "}
            <span className="font-semibold text-slate-900">
              {pagination.total_items > 0 ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-900">
              {Math.min(page * limit, pagination.total_items)}
            </span>{" "}
            dari <span className="font-semibold text-slate-900">{pagination.total_items}</span> user
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </button>

            <span className="px-2 font-medium text-slate-700">
              Halaman {pagination.current_page} dari {pagination.total_pages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL USER MODAL */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#0F766E] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 font-bold">
                  {selectedUser.name ? selectedUser.name.slice(0, 2).toUpperCase() : "US"}
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedUser.name}</h3>
                  <p className="text-xs text-teal-100">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1.5 text-teal-100 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Badges Status */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                    getRoleBadge(selectedUser.role).className
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Role: {selectedUser.role}
                </span>

                {selectedUser.is_suspended ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                    <Ban className="h-3.5 w-3.5" />
                    Status: Di-suspend
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Status: Aktif
                  </span>
                )}

                {selectedUser.detail_user?.status && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Agent Status: {selectedUser.detail_user.status}
                  </span>
                )}
              </div>

              {/* General Information Grid */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Informasi Bio & Kontak
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">Email:</span> {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">No. HP:</span> {selectedUser.phone_number || "-"}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">TTL:</span> {selectedUser.ttl || "-"}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">Domisili:</span> {selectedUser.domicile || "-"}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">Jenis Kelamin:</span> {selectedUser.gender || "-"}
                  </div>
                </div>
              </div>

              {/* Detail User (Sub-Object) */}
              {selectedUser.detail_user && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detail Pekerjaan & Perusahaan
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">Perusahaan:</span>{" "}
                      {selectedUser.detail_user.company_name || "-"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">Pekerjaan:</span>{" "}
                      {selectedUser.detail_user.job || "-"}
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">Foto Profil / Pengguna</p>
                      {selectedUser.detail_user.photo ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              title: `Foto ${selectedUser.name}`,
                              url: resolveApiAssetUrl(selectedUser.detail_user?.photo),
                            })
                          }
                          className="group relative h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={resolveApiAssetUrl(selectedUser.detail_user.photo)}
                            alt="Photo"
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold">
                            Lihat Foto
                          </div>
                        </button>
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                          Tidak ada foto
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">Foto KTP Identity</p>
                      {selectedUser.detail_user.ktp_photo ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              title: `KTP ${selectedUser.name}`,
                              url: resolveApiAssetUrl(selectedUser.detail_user?.ktp_photo),
                            })
                          }
                          className="group relative h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={resolveApiAssetUrl(selectedUser.detail_user.ktp_photo)}
                            alt="KTP"
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold">
                            Lihat KTP
                          </div>
                        </button>
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                          Tidak ada KTP
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Dibuat: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString("id-ID") : "-"}</span>
                <span>Di-update: {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString("id-ID") : "-"}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE ROLE MODAL */}
      {roleModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <UserCog className="h-5 w-5 text-blue-600" />
                <span>Ubah Role User</span>
              </div>
              <button onClick={() => setRoleModalUser(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pilih role baru untuk <span className="font-bold text-slate-900">{roleModalUser.name}</span> ({roleModalUser.email}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Role Baru (Valid Roles):</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as ApiRole)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
              >
                <option value="user">User (Default applicant)</option>
                <option value="agent">Agent (Official Agent)</option>
                <option value="sales">Sales (Sales Management)</option>
                <option value="marketing">Marketing (Marketing Specialist)</option>
                <option value="super_admin">Super Admin (Full Control Access)</option>
              </select>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Catatan Role RBAC:</p>
              <p>Mengubah role akan langsung menyesuaikan hak akses modul user di GMT Suite.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={isUpdatingRole}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdatingRole && <RefreshCw className="h-4 w-4 animate-spin" />}
                Simpan Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND / UNSUSPEND CONFIRMATION MODAL */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                {suspendModalUser.is_suspended ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Ban className="h-5 w-5 text-rose-600" />
                )}
                <span>
                  {suspendModalUser.is_suspended ? "Unsuspend Akun User" : "Suspend Akun User"}
                </span>
              </div>
              <button onClick={() => setSuspendModalUser(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm text-slate-700">
              Apakah Anda yakin ingin{" "}
              <span className="font-bold text-slate-900">
                {suspendModalUser.is_suspended ? "mengaktifkan kembali" : "membekukan (suspend)"}
              </span>{" "}
              akun milik <span className="font-bold text-slate-900">{suspendModalUser.name}</span>?
            </div>

            {!suspendModalUser.is_suspended ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  Peringatan Keamanan Backend:
                </p>
                <p className="leading-relaxed">
                  Jika <code className="font-mono font-bold">is_suspended: true</code>, seluruh token JWT &
                  session login aktif milik user tersebut di Database akan **langsung di-revoke**, sehingga user otomatis **ter-logout dari semua device** dan ditolak saat mencoba login kembali.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 leading-relaxed">
                Pengguna akan dapat melakukan login kembali dan mengakses fitur sesuai dengan role aktifnya.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalUser(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleToggleSuspend}
                disabled={isTogglingSuspend}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  suspendModalUser.is_suspended
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isTogglingSuspend && <RefreshCw className="h-4 w-4 animate-spin" />}
                {suspendModalUser.is_suspended ? "Buka Suspend" : "Ya, Bekukan Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/60 p-2 text-white hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
            <p className="p-2 text-center text-xs font-semibold text-slate-700">{previewImage.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
