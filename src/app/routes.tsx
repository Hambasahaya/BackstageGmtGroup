import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import {
  ArticleManagement,
  EventManagement,
  MediaLibrary,
  MultiWebsiteManagement,
  NotificationCenter,
  ParticipantManagement,
  Reporting,
  SeoManagement,
  TaskWorkflow,
  UserRoleManagement,
} from "./components/GMTModules";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "websites",
        Component: MultiWebsiteManagement,
      },
      {
        path: "seo",
        Component: SeoManagement,
      },
      {
        path: "articles",
        Component: ArticleManagement,
      },
      {
        path: "events",
        Component: EventManagement,
      },
      {
        path: "participants",
        Component: ParticipantManagement,
      },
      {
        path: "notifications",
        Component: NotificationCenter,
      },
      {
        path: "roles",
        Component: UserRoleManagement,
      },
      {
        path: "media",
        Component: MediaLibrary,
      },
      {
        path: "workflow",
        Component: TaskWorkflow,
      },
      {
        path: "reports",
        Component: Reporting,
      },
    ],
  },
]);
