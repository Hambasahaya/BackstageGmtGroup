import { Outlet, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  FileBarChart,
  FileText,
  GraduationCap,
  Globe2,
  Images,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Menu,
  ShoppingCart,
  Search,
  Settings,
  ShieldCheck,
  LogOut,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ElementType } from "react";
import { getCurrentAgentStatus, getCurrentRole, roleLabels, type AppRole } from "../auth/roles";
import {
  api,
  authSessionUpdatedEvent,
  clearAuthSession,
  clearLoginSource,
  connectSalesNotificationStream,
  getLogoutRedirectUrl,
  getStoredUser,
  type AgentApplicationStatus,
  type NotificationDto,
  type UserSession,
} from "../services/api";

type MenuItem = {
  icon: ElementType;
  label: string;
  path: string;
  roles: AppRole[];
  statuses?: AgentApplicationStatus[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard", roles: ["super_admin"] },
  { icon: Globe2, label: "Websites", path: "/websites", roles: ["super_admin"] },
  { icon: BarChart3, label: "SEO Management", path: "/seo", roles: ["super_admin"] },
  { icon: Megaphone, label: "Marketing Integrations", path: "/integrations", roles: ["super_admin"] },
  { icon: FileText, label: "Article CMS", path: "/articles", roles: ["super_admin"] },
  { icon: CalendarDays, label: "Events", path: "/events", roles: ["super_admin"] },
  { icon: UserCheck, label: "Participants", path: "/participants", roles: ["super_admin"] },
  { icon: UserPlus, label: "Agent Applications", path: "/agent-applications", roles: ["super_admin"] },
  { icon: Wallet, label: "Withdraw Approval", path: "/withdraw-approvals", roles: ["super_admin"] },
  { icon: UserPlus, label: "Apply Agent", path: "/apply-agent", roles: ["user"], statuses: ["not_verif", "verif", "stopped_agent"] },
  { icon: Trophy, label: "Achievement", path: "/agent-achievement", roles: ["agent"], statuses: ["official_agent"] },
  { icon: GraduationCap, label: "Agent Onboarding", path: "/agent-onboarding", roles: ["agent"], statuses: ["official_agent"] },
  { icon: ShoppingCart, label: "Purchase Order", path: "/agent-purchase-orders", roles: ["agent"], statuses: ["official_agent"] },
  { icon: Wallet, label: "Withdraw", path: "/agent-withdraw", roles: ["agent"], statuses: ["official_agent"] },
  { icon: ShoppingCart, label: "Sales Orders", path: "/sales-orders", roles: ["sales"] },
  { icon: Bell, label: "Notifications", path: "/notifications", roles: ["super_admin"] },
  { icon: ShieldCheck, label: "Manajemen User", path: "/roles", roles: ["super_admin"] },
  { icon: Images, label: "Media Library", path: "/media", roles: ["super_admin"] },
  { icon: ClipboardList, label: "Task Workflow", path: "/workflow", roles: ["super_admin"] },
  { icon: FileBarChart, label: "Reporting", path: "/reports", roles: ["super_admin"] },
];

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let notificationAudioContext: AudioContext | null = null;
let notificationAudioElement: HTMLAudioElement | null = null;
const notificationSoundUrl = "https://www.myinstants.com/media/sounds/fahhhhhhhhhhhhhh.mp3";
const salesAudioEnabledStorageKey = "gmt-sales-notification-audio-enabled";

function getNotificationAudioContext() {
  const AudioContextCtor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!notificationAudioContext) {
    notificationAudioContext = new AudioContextCtor();
  }

  return notificationAudioContext;
}

function getNotificationAudioElement() {
  if (!notificationAudioElement) {
    notificationAudioElement = new Audio(notificationSoundUrl);
    notificationAudioElement.preload = "auto";
    notificationAudioElement.volume = 0.9;
  }

  return notificationAudioElement;
}

function primeNotificationAudio() {
  const audioContext = getNotificationAudioContext();

  if (audioContext?.state === "suspended") {
    void audioContext.resume();
  }

  getNotificationAudioElement().load();
}

async function playNotificationSound() {
  try {
    const audioElement = getNotificationAudioElement();
    audioElement.currentTime = 0;
    await audioElement.play();
  } catch {
    // Browsers can block audio until the sales user interacts with the page.
  }
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [showSalesAudioPrompt, setShowSalesAudioPrompt] = useState(false);
  const [unreadSalesNotifications, setUnreadSalesNotifications] = useState(0);
  const [latestSalesNotification, setLatestSalesNotification] = useState<NotificationDto | null>(null);
  const [salesStreamStatus, setSalesStreamStatus] = useState<"idle" | "connected" | "reconnecting">("idle");
  const [storedUser, setStoredUser] = useState<UserSession | null>(() => getStoredUser());
  const latestNotificationTimerRef = useRef<number>();
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const currentRole = getCurrentRole();
  const currentAgentStatus = getCurrentAgentStatus();
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles.includes(currentRole)) {
      return false;
    }
    if (!item.statuses) {
      return true;
    }
    if (!currentAgentStatus) {
      return item.path === "/apply-agent";
    }
    return item.statuses.includes(currentAgentStatus);
  });
  const initials = (storedUser?.name ?? roleLabels[currentRole])
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const currentUser = storedUser
    ? { initials, name: storedUser.name, email: storedUser.email }
    : currentRole === "agent"
      ? { initials: "AG", name: "GMT Agent", email: "agent@gmtgroup.id" }
      : currentRole === "sales"
        ? { initials: "SL", name: "GMT Sales", email: "sales@gmtgroup.id" }
        : { initials: "GA", name: roleLabels[currentRole], email: "session@gmtgroup.id" };
  const unreadNotificationCount = notifications.filter(
    (notification) => notification.status === "belum_terbaca" || !notification.read_at,
  ).length;
  const notificationBadgeCount =
    currentRole === "sales" ? Math.max(unreadNotificationCount, unreadSalesNotifications) : unreadNotificationCount;

  const loadNotifications = async (silent = false) => {
    if (!silent) {
      setNotificationLoading(true);
    }
    setNotificationError("");

    try {
      const response = await api.notifications();
      setNotifications(Array.isArray(response.notifications) ? response.notifications : []);
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Gagal memuat notifikasi.");
    } finally {
      if (!silent) {
        setNotificationLoading(false);
      }
    }
  };

  const openNotificationPanel = () => {
    setNotificationOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        void loadNotifications();
      }

      return nextOpen;
    });
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadSalesNotifications(0);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          status: "terbaca",
          read_at: notification.read_at ?? new Date().toISOString(),
        })),
      );
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Gagal menandai notifikasi.");
    }
  };

  const openNotificationTarget = (notification: NotificationDto) => {
    if (currentRole === "sales") {
      navigate("/sales-orders");
      setNotificationOpen(false);
      return;
    }

    if (currentRole === "super_admin") {
      navigate("/notifications");
      setNotificationOpen(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationDto) => {
    if (notification.id) {
      try {
        await api.markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, status: "terbaca", read_at: item.read_at ?? new Date().toISOString() }
              : item,
          ),
        );
      } catch {
        // The notification still opens even if the read marker fails.
      }
    }

    setUnreadSalesNotifications((count) => Math.max(0, count - 1));
    openNotificationTarget(notification);
  };

  const handleLogout = async () => {
    const redirectUrl = getLogoutRedirectUrl();

    try {
      await api.logout();
    } catch {
      // Local cleanup still needs to happen when the server session is already gone.
    } finally {
      clearAuthSession();
      clearLoginSource();
      window.location.assign(redirectUrl);
    }
  };

  const enableSalesNotificationAudio = async () => {
    primeNotificationAudio();
    await playNotificationSound();
    window.localStorage.setItem(salesAudioEnabledStorageKey, "true");
    setShowSalesAudioPrompt(false);
  };

  useEffect(() => {
    const refreshStoredSession = () => {
      setStoredUser(getStoredUser());
    };

    window.addEventListener(authSessionUpdatedEvent, refreshStoredSession);
    window.addEventListener("storage", refreshStoredSession);

    return () => {
      window.removeEventListener(authSessionUpdatedEvent, refreshStoredSession);
      window.removeEventListener("storage", refreshStoredSession);
    };
  }, []);

  useEffect(() => {
    if (currentRole !== "sales") {
      return;
    }

    const unlockAudio = () => {
      primeNotificationAudio();
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [currentRole]);

  useEffect(() => {
    if (currentRole === "sales" && window.localStorage.getItem(salesAudioEnabledStorageKey) !== "true") {
      setShowSalesAudioPrompt(true);
    }
  }, [currentRole]);

  useEffect(() => {
    void loadNotifications(true);
  }, [currentRole]);

  useEffect(() => {
    if (!notificationOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationPanelRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [notificationOpen]);

  useEffect(() => {
    if (currentRole !== "sales") {
      return;
    }

    const restoreTitle = document.title;

    const disconnect = connectSalesNotificationStream({
      onOpen: () => setSalesStreamStatus("connected"),
      onError: () => setSalesStreamStatus("reconnecting"),
      onNotification: (notification) => {
        setUnreadSalesNotifications((count) => count + 1);
        setNotifications((current) => [{ ...notification, status: notification.status ?? "belum_terbaca" }, ...current]);
        setLatestSalesNotification(notification);
        void playNotificationSound();
        window.dispatchEvent(new CustomEvent("sales-notification", { detail: notification }));

        if (document.hidden) {
          document.title = `PO baru - ${restoreTitle}`;
        }

        if (latestNotificationTimerRef.current) {
          window.clearTimeout(latestNotificationTimerRef.current);
        }

        latestNotificationTimerRef.current = window.setTimeout(() => {
          setLatestSalesNotification(null);
          document.title = restoreTitle;
        }, 7000);
      },
    });

    return () => {
      disconnect();
      document.title = restoreTitle;

      if (latestNotificationTimerRef.current) {
        window.clearTimeout(latestNotificationTimerRef.current);
      }
    };
  }, [currentRole]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900">
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200 bg-white transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-[#0F766E] bg-[#0F766E] px-5">
            <div className="flex h-12 w-40 items-center">
              <img src="/img/GMT Suite-04.png" alt="GMT Suite" className="h-full w-full object-contain object-left" />
            </div>
            <button
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {visibleMenuItems.map((item) => {
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
                {currentUser.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
              </div>
            </div>
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
            <div ref={notificationPanelRef} className="relative">
              <button
                type="button"
                onClick={openNotificationPanel}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                title={
                  currentRole === "sales"
                    ? salesStreamStatus === "connected"
                      ? "Realtime sales aktif"
                      : "Realtime sales menyambung ulang"
                    : "Notifications"
                }
                aria-label="Buka notifikasi"
                aria-expanded={notificationOpen}
              >
                <Bell className="h-5 w-5" />
                {notificationBadgeCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                    {notificationBadgeCount > 9 ? "9+" : notificationBadgeCount}
                  </span>
                ) : (
                  <span
                    className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${
                      currentRole === "sales" && salesStreamStatus === "connected" ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Notifikasi</p>
                      <p className="text-xs text-slate-500">
                        {notificationBadgeCount > 0 ? `${notificationBadgeCount} belum dibaca` : "Semua sudah dibaca"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      disabled={!notifications.length}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Read all
                    </button>
                  </div>

                  {notificationError && (
                    <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
                      {notificationError}
                    </div>
                  )}

                  <div className="max-h-96 overflow-y-auto">
                    {notificationLoading ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat notifikasi...
                      </div>
                    ) : notifications.length ? (
                      notifications.map((notification, index) => {
                        const isUnread = notification.status === "belum_terbaca" || !notification.read_at;

                        return (
                          <button
                            key={notification.id ?? `${notification.title}-${index}`}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                          >
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                isUnread ? "bg-rose-500" : "bg-slate-300"
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-950">
                                {notification.title ?? "Notifikasi Baru"}
                              </span>
                              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600">
                                {notification.message ?? "Ada update baru di dashboard."}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        Belum ada notifikasi.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 sm:flex">
              <Users className="h-4 w-4 text-[#0F766E]" />
              {roleLabels[currentRole]}
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

      {currentRole === "sales" && showSalesAudioPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl ring-1 ring-black/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Aktifkan suara notifikasi</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Klik aktifkan agar notifikasi PO baru sales bisa memutar suara.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSalesAudioPrompt(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={() => void enableSalesNotificationAudio()}
                className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
              >
                Aktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {currentRole === "sales" && latestSalesNotification && (
        <button
          onClick={() => {
            setLatestSalesNotification(null);
            setUnreadSalesNotifications(0);
            navigate("/sales-orders");
          }}
          className="fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border border-teal-200 bg-white p-4 text-left shadow-xl ring-1 ring-black/5 sm:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-950">
                {latestSalesNotification.title ?? "Preorder Baru"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {latestSalesNotification.message ?? "PO baru masuk dan perlu direview sales."}
              </p>
              <p className="mt-2 text-xs font-semibold text-[#0F766E]">Buka review order</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
