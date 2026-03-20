import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate, useRoutes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@/Layout";
import Login from "@/pages/Authentication/Login";
import Register from "@/pages/Authentication/Register";
import ForgotPassword from "@/pages/Authentication/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Database from "@/pages/Database";
import Academics from "@/pages/Academics";
import Admin from "@/pages/Admin";
import Communications from "@/pages/Communications";
import Finance from "@/pages/Finance";
import HR from "@/pages/HR";
import Modules from "@/pages/Modules";

const AppRoutes = () => {
  const routes: RouteObject[] = [
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard", element: <Suspense><Dashboard /></Suspense> },
        { path: "dashboard/:lotId", element: <Suspense><Upload /></Suspense> },
        { path: "database", element: <Suspense><Database /></Suspense> },
        { path: "academics", element: <Suspense><Academics /></Suspense> },
        { path: "admin", element: <Suspense><Admin /></Suspense> },
        { path: "communications", element: <Suspense><Communications /></Suspense> },
        { path: "finance", element: <Suspense><Finance /></Suspense> },
        { path: "hr", element: <Suspense><HR /></Suspense> },
        { path: "modules", element: <Suspense><Modules /></Suspense> },
      ],
    },
    { path: "/login", element: <Suspense><Login /></Suspense> },
    { path: "/register", element: <Suspense><Register /></Suspense> },
    { path: "/forgot-password", element: <Suspense><ForgotPassword /></Suspense> },
    { path: "*", element: <Suspense>{/* <NotFound /> */}</Suspense> },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
