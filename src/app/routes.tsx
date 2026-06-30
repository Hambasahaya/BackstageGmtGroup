import { createBrowserRouter, Navigate } from "react-router";
import type { ReactNode } from "react";
import { AuthGate } from "./auth/AuthGate";
import { canAccessRole, getCurrentAgentStatus, getCurrentRole, roleHomePaths, roleLabels, type AppRole } from "./auth/roles";
import { Layout } from "./components/Layout";
import { AgentOnboarding } from "./components/AgentOnboarding";
import { AgentPurchaseOrder } from "./components/AgentPurchaseOrder";
import { AgentWithdraw } from "./components/AgentWithdraw";
import { AgentAchievement } from "./components/AgentAchievement";
import { AgentApplications } from "./components/AgentApplications";
import { ApplyAgent } from "./components/ApplyAgent";
import { Dashboard } from "./components/Dashboard";
import { EducationEvents } from "./components/EducationEvents";
import { Login } from "./components/Login";
import { ForgotPassword } from "./components/ForgotPassword";
import { ResetPassword } from "./components/ResetPassword";
import { MyGmtEntry } from "./components/MyGmtEntry";
import { Register } from "./components/Register";
import { SalesOrders } from "./components/SalesOrders";
import { SsoCallback } from "./components/SsoCallback";
import { SuperAdminWithdraws } from "./components/SuperAdminWithdraws";
import {
  ArticleManagement,
  MediaLibrary,
  MarketingIntegrations,
  ModelKnowledgeBaseManagement,
  MultiWebsiteManagement,
  NotificationCenter,
  ParticipantManagement,
  Reporting,
  SeoManagement,
  TaskWorkflow,
  UserRoleManagement,
} from "./components/GMTModules";

function RoleGate({ allowedRoles, children }: { allowedRoles: AppRole[]; children: ReactNode }) {
  const currentRole = getCurrentRole();

  if (!canAccessRole(currentRole, allowedRoles)) {
    return <Navigate to={roleHomePaths[currentRole]} replace />;
  }

  return <>{children}</>;
}

function OfficialAgentGate({ children }: { children: ReactNode }) {
  if (getCurrentAgentStatus() !== "official_agent") {
    return <Navigate to="/apply-agent" replace />;
  }

  return <>{children}</>;
}

function RoleHomeRedirect() {
  const currentRole = getCurrentRole();

  if (currentRole === "marketing") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F766E]">{roleLabels[currentRole]}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Fitur role belum tersedia</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Role ini sudah dikenali dari session API, tetapi dokumentasi backend belum menyediakan endpoint dashboard khusus.
        </p>
      </div>
    );
  }

  return <Navigate to={roleHomePaths[currentRole]} replace />;
}

const superAdminOnly: AppRole[] = ["super_admin"];
const agentOnly: AppRole[] = ["agent"];
const salesOnly: AppRole[] = ["sales"];
const userOnly: AppRole[] = ["user"];

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/mygmt",
    Component: MyGmtEntry,
  },
  {
    path: "/sso/callback",
    Component: SsoCallback,
  },
  {
    path: "/",
    element: (
      <AuthGate>
        <Layout />
      </AuthGate>
    ),
    children: [
      {
        index: true,
        element: <RoleHomeRedirect />,
      },
      {
        path: "dashboard",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <Dashboard />
          </RoleGate>
        ),
      },
      {
        path: "websites",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <MultiWebsiteManagement />
          </RoleGate>
        ),
      },
      {
        path: "seo",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <SeoManagement />
          </RoleGate>
        ),
      },
      {
        path: "integrations",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <MarketingIntegrations />
          </RoleGate>
        ),
      },
      {
        path: "model-knowledge-base",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <ModelKnowledgeBaseManagement />
          </RoleGate>
        ),
      },
      {
        path: "articles",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <ArticleManagement />
          </RoleGate>
        ),
      },
      {
        path: "events",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <EducationEvents />
          </RoleGate>
        ),
      },
      {
        path: "participants",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <ParticipantManagement />
          </RoleGate>
        ),
      },
      {
        path: "agent-applications",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <AgentApplications />
          </RoleGate>
        ),
      },
      {
        path: "withdraw-approvals",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <SuperAdminWithdraws />
          </RoleGate>
        ),
      },
      {
        path: "apply-agent",
        element: (
          <RoleGate allowedRoles={userOnly}>
            <ApplyAgent />
          </RoleGate>
        ),
      },
      {
        path: "agent-achievement",
        element: (
          <RoleGate allowedRoles={agentOnly}>
            <OfficialAgentGate>
              <AgentAchievement />
            </OfficialAgentGate>
          </RoleGate>
        ),
      },
      {
        path: "agent-onboarding",
        element: (
          <RoleGate allowedRoles={agentOnly}>
            <OfficialAgentGate>
              <AgentOnboarding />
            </OfficialAgentGate>
          </RoleGate>
        ),
      },
      {
        path: "agent-withdraw",
        element: (
          <RoleGate allowedRoles={agentOnly}>
            <AgentWithdraw />
          </RoleGate>
        ),
      },
      {
        path: "agent-purchase-orders",
        element: (
          <RoleGate allowedRoles={agentOnly}>
            <AgentPurchaseOrder />
          </RoleGate>
        ),
      },
      {
        path: "sales-orders",
        element: (
          <RoleGate allowedRoles={salesOnly}>
            <SalesOrders />
          </RoleGate>
        ),
      },
      {
        path: "notifications",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <NotificationCenter />
          </RoleGate>
        ),
      },
      {
        path: "roles",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <UserRoleManagement />
          </RoleGate>
        ),
      },
      {
        path: "media",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <MediaLibrary />
          </RoleGate>
        ),
      },
      {
        path: "workflow",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <TaskWorkflow />
          </RoleGate>
        ),
      },
      {
        path: "reports",
        element: (
          <RoleGate allowedRoles={superAdminOnly}>
            <Reporting />
          </RoleGate>
        ),
      },
    ],
  },
]);
