import { Outlet, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileText,
  FolderKanban,
  Globe2,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Globe2, label: "Websites", path: "/websites" },
  { icon: BarChart3, label: "SEO Management", path: "/seo" },
  { icon: FileText, label: "Article CMS", path: "/articles" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: UserCheck, label: "Participants", path: "/participants" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: ShieldCheck, label: "Users & Roles", path: "/roles" },
  { icon: Images, label: "Media Library", path: "/media" },
  { icon: ClipboardList, label: "Task Workflow", path: "/workflow" },
  { icon: FileBarChart, label: "Reporting", path: "/reports" },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900">
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200 bg-white transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] text-white">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold leading-tight">GMT Group</p>
                <p className="text-xs text-slate-500">Central Dashboard</p>
              </div>
            </div>
            <button
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-[#0F766E] text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B] font-semibold text-white">
                GA
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">GMT Admin</p>
                <p className="truncate text-xs text-slate-500">manager@gmtgroup.id</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari website, keyword, artikel, event..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Settings className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 sm:flex">
              <Users className="h-4 w-4 text-[#0F766E]" />
              Super Admin
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
