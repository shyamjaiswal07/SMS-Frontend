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
        {
          index: true,
          element: <Navigate to="dashboard" replace />,
        },
        {
          path: "dashboard",
          element: (
            <Suspense>
              <Dashboard />
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
              <Academics />
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
      path: "*",
      element: <Suspense>{/* <NotFound /> */}</Suspense>,
    },
  ];

  const element = useRoutes(routes);
  return element;
};

export default AppRoutes;

