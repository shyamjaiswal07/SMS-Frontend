import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate, useRoutes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@/Layout";
import Login from "@/pages/Authentication/Login";
import Register from "@/pages/Authentication/Register";
import ForgotPassword from "@/pages/Authentication/ForgotPassword";
import ResetPassword from "@/pages/Authentication/ResetPassword";
import DashboardSprintPage from "@/pages/Dashboard/Sprint";
import Upload from "@/pages/Upload";
import Database from "@/pages/Database";
import AcademicsSprintPage from "@/pages/Academics/Sprint";
import AdminSprintPage from "@/pages/Admin/Sprint";
import Communications from "@/pages/Communications";
import FinanceSprintPage from "@/pages/Finance/Sprint";
import HRSprintPage from "@/pages/HR/Sprint";
import Institutions from "@/pages/Institutions";
import Library from "@/pages/Library";
import Modules from "@/pages/Modules";
import StudentsSprintPage from "@/pages/Students/Sprint";
import Transport from "@/pages/Transport";

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
        {
          path: "dashboard",
          element: (
            <Suspense>
              <DashboardSprintPage />
            </Suspense>
          ),
        },
        {
          path: "dashboard/:lotId",
          element: (
            <Suspense>
              <Upload />
            </Suspense>
          ),
        },
        {
          path: "students",
          element: (
            <Suspense>
              <StudentsSprintPage />
            </Suspense>
          ),
        },
        {
          path: "database",
          element: (
            <Suspense>
              <Database />
            </Suspense>
          ),
        },
        {
          path: "academics",
          element: (
            <Suspense>
              <AcademicsSprintPage />
            </Suspense>
          ),
        },
        {
          path: "institutions",
          element: (
            <Suspense>
              <Institutions />
            </Suspense>
          ),
        },
        {
          path: "admin",
          element: (
            <Suspense>
              <AdminSprintPage />
            </Suspense>
          ),
        },
        {
          path: "communications",
          element: (
            <Suspense>
              <Communications />
            </Suspense>
          ),
        },
        {
          path: "finance",
          element: (
            <Suspense>
              <FinanceSprintPage />
            </Suspense>
          ),
        },
        {
          path: "hr",
          element: (
            <Suspense>
              <HRSprintPage />
            </Suspense>
          ),
        },
        {
          path: "library",
          element: (
            <Suspense>
              <Library />
            </Suspense>
          ),
        },
        {
          path: "modules",
          element: (
            <Suspense>
              <Modules />
            </Suspense>
          ),
        },
        {
          path: "transport",
          element: (
            <Suspense>
              <Transport />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "/login",
      element: (
        <Suspense>
          <Login />
        </Suspense>
      ),
    },
    {
      path: "/register",
      element: (
        <Suspense>
          <Register />
        </Suspense>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <Suspense>
          <ForgotPassword />
        </Suspense>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <Suspense>
          <ResetPassword />
        </Suspense>
      ),
    },
    { path: "*", element: <Suspense>{/* <NotFound /> */}</Suspense> },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
